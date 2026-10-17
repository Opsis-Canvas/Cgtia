/**
 * Student portal — authenticated home, fees, courses, results, profile
 * Desktop: sidebar (LAUTECH-style structure) · Mobile: bottom nav (soft learning app)
 */
import { createElement, useState, useEffect } from "react";
import htm from "htm";
import { getFirebase } from "../services/firebase.service.js";

const html = htm.bind(createElement);

const NAV = [
  { id: "home", label: "Home" },
  { id: "fees", label: "Fees" },
  { id: "courses", label: "Courses" },
  { id: "results", label: "Results" },
  { id: "profile", label: "Profile" }
];

function Icon({ name }) {
  const paths = {
    home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    fees: "M4 6h16v12H4zM4 10h16M8 14h4",
    courses: "M4 5h16v14H4zM8 9h8M8 13h6",
    results: "M5 19V9l7-4 7 4v10M9 19v-6h6v6",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0"
  };
  return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d=${paths[name] || paths.home} /></svg>`;
}

function Chip({ status }) {
  const s = String(status || "").toLowerCase();
  let cls = "chip chip-muted";
  let label = status || "—";
  if (/paid|complete|pass|active|published/.test(s)) { cls = "chip chip-ok"; }
  else if (/pend|due|partial|progress/.test(s)) { cls = "chip chip-pending"; }
  return html`<span class=${cls}>${label}</span>`;
}

async function loadPortalData(user) {
  const { db, api } = await getFirebase();
  const email = (user.email || "").toLowerCase().trim();
  let student = null;
  try {
    const q = api.query(api.collection(db, "students"), api.where("email", "==", email));
    const snap = await api.getDocs(q);
    snap.forEach((d) => {
      if (!student && d.data().trashed !== true) student = { id: d.id, ...d.data() };
    });
  } catch (e) {
    console.warn("student query", e);
  }

  let courses = [];
  try {
    const snap = await api.getDocs(api.collection(db, "courses"));
    snap.forEach((d) => {
      const c = { id: d.id, ...d.data() };
      if (c.active === false) return;
      if (student && student.program && c.program && c.program !== student.program) return;
      courses.push(c);
    });
    courses.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
  } catch (e) { console.warn("courses", e); }

  let grades = [];
  try {
    const snap = await api.getDocs(api.collection(db, "grades"));
    snap.forEach((d) => {
      const g = { id: d.id, ...d.data() };
      if (g.published === false) return;
      const match =
        (student && g.studentId === student.id) ||
        (g.studentEmail && g.studentEmail.toLowerCase() === email);
      if (match) grades.push(g);
    });
  } catch (e) { console.warn("grades", e); }

  let payments = [];
  try {
    const snap = await api.getDocs(api.collection(db, "payments"));
    snap.forEach((d) => {
      const p = { id: d.id, ...d.data() };
      if ((p.email || "").toLowerCase() === email) payments.push(p);
    });
    payments.sort((a, b) => String(b.paidAt || b.createdAt || "").localeCompare(String(a.paidAt || a.createdAt || "")));
  } catch (e) { console.warn("payments", e); }

  return { student, courses, grades, payments };
}

function LoginGate({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
      const { getAuth, signInWithEmailAndPassword } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
      const cfg = {
        apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
        authDomain: "verify-cgtia-cert.firebaseapp.com",
        projectId: "verify-cgtia-cert",
        storageBucket: "verify-cgtia-cert.firebasestorage.app",
        messagingSenderId: "766655761701",
        appId: "1:766655761701:web:45f559e0e38023439b5ecc"
      };
      const app = getApps().length ? getApp() : initializeApp(cfg);
      const auth = getAuth(app);
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      onAuthed(cred.user);
    } catch (ex) {
      setErr("Could not sign in. Check email and password, or use the code you received after payment.");
    } finally {
      setLoading(false);
    }
  }

  return html`
    <div class="cgtia-portal">
      <div class="portal-gate">
        <div class="portal-brand" style=${{ padding: "0 0 1rem" }}>
          <span class="portal-brand-mark">C</span>
          <span>CGTIA Portal</span>
        </div>
        <h1>Student sign in</h1>
        <p>Use the email and password (or one-time code) from your admission payment.</p>
        <form onSubmit=${submit}>
          <input type="email" required placeholder="School email" value=${email} onInput=${(e) => setEmail(e.target.value)} />
          <input type="password" required placeholder="Password" value=${password} onInput=${(e) => setPassword(e.target.value)} />
          ${err ? html`<p class="portal-err">${err}</p>` : null}
          <button class="primary" type="submit" disabled=${loading}>${loading ? "Signing in…" : "Sign in"}</button>
        </form>
        <p style=${{ marginTop: "1rem", fontSize: "0.8rem" }}><a href="/" style=${{ color: "#1e3a8a" }}>← Back to website</a></p>
      </div>
    </div>
  `;
}

export function DashboardPage() {
  const [user, setUser] = useState(null);
  const [boot, setBoot] = useState(true);
  const [data, setData] = useState(null);
  const [section, setSection] = useState("home");
  const [loadErr, setLoadErr] = useState("");

  useEffect(() => {
    let unsub = () => {};
    (async () => {
      try {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "/css/portal.css";
        if (!document.querySelector('link[href="/css/portal.css"]')) document.head.appendChild(link);

        const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
        const { getAuth, onAuthStateChanged } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
        const cfg = {
          apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
          authDomain: "verify-cgtia-cert.firebaseapp.com",
          projectId: "verify-cgtia-cert",
          storageBucket: "verify-cgtia-cert.firebasestorage.app",
          messagingSenderId: "766655761701",
          appId: "1:766655761701:web:45f559e0e38023439b5ecc"
        };
        const app = getApps().length ? getApp() : initializeApp(cfg);
        const auth = getAuth(app);
        unsub = onAuthStateChanged(auth, async (u) => {
          setUser(u);
          setBoot(false);
          if (u) {
            try {
              const d = await loadPortalData(u);
              setData(d);
            } catch (e) {
              setLoadErr(e.message || "Could not load portal data");
            }
          } else {
            setData(null);
          }
        });
      } catch (e) {
        setBoot(false);
        setLoadErr(e.message || "Auth failed to start");
      }
    })();
    return () => { try { unsub(); } catch (_) {} };
  }, []);

  async function logout() {
    const { getAuth, signOut } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
    const { getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    if (!getApps().length) return;
    await signOut(getAuth(getApp()));
    setUser(null);
    setData(null);
  }

  if (boot) {
    return html`<div class="cgtia-portal" style=${{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading portal…</div>`;
  }
  if (!user) return html`<${LoginGate} onAuthed=${setUser} />`;

  const st = (data && data.student) || null;
  const name = st ? (st.fullLegalName || st.fullName || user.email) : user.email;
  const reg = st ? (st.regNumber || "—") : "—";
  const program = st ? (st.program || "—") : "—";
  const initial = String(name || "S").charAt(0).toUpperCase();

  const paidTotal = (data && data.payments || []).reduce((n, p) => n + (Number(p.amountPaid || p.amount) || 0), 0);

  function navBtn(id, label, mobile) {
    const on = section === id;
    if (mobile) {
      return html`<button type="button" class=${on ? "on" : ""} onClick=${() => setSection(id)}>
        <${Icon} name=${id === "fees" ? "fees" : id === "courses" ? "courses" : id === "results" ? "results" : id === "profile" ? "profile" : "home"} />
        ${label}
      </button>`;
    }
    return html`<button type="button" class=${"portal-nav-btn" + (on ? " on" : "")} onClick=${() => setSection(id)}>${label}</button>`;
  }

  let body = null;
  if (section === "home") {
    body = html`
      <div class="portal-card portal-profile">
        ${st && st.photoUrl
          ? html`<img class="portal-avatar" src=${st.photoUrl} alt="" />`
          : html`<div class="portal-avatar placeholder">${initial}</div>`}
        <div>
          <h2 style=${{ margin: "0 0 0.35rem", fontSize: "1.25rem" }}>${name}</h2>
          <p style=${{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>${user.email}</p>
        </div>
        <div class="portal-meta">
          <div><span>Reg number</span><strong>${reg}</strong></div>
          <div><span>Programme</span><strong>${program}</strong></div>
          <div><span>Status</span><strong><${Chip} status=${st && st.status ? st.status : (paidTotal > 0 ? "Active" : "Pending")} /></strong></div>
          <div><span>Payments recorded</span><strong>₦${paidTotal.toLocaleString()}</strong></div>
        </div>
      </div>
      <div class="portal-grid two">
        <div class="portal-card">
          <h3 style=${{ margin: "0 0 0.75rem", fontSize: "1rem" }}>Quick status</h3>
          <div class="portal-stat"><div class="label">Courses on your track</div><div class="value">${(data && data.courses || []).length}</div></div>
          <div class="portal-stat" style=${{ marginTop: "0.6rem" }}><div class="label">Published results</div><div class="value">${(data && data.grades || []).length}</div></div>
        </div>
        <div class="portal-card">
          <h3 style=${{ margin: "0 0 0.75rem", fontSize: "1rem" }}>What’s next</h3>
          <p class="portal-empty" style=${{ padding: 0 }}>
            ${!st
              ? "Your login works, but no student record is linked to this email yet. Contact admissions."
              : (data && data.grades && data.grades.length
                  ? "Your results are available under Results."
                  : "When grades are published by your instructors, they will appear under Results.")}
          </p>
        </div>
      </div>
    `;
  } else if (section === "fees") {
    const pays = (data && data.payments) || [];
    body = html`
      <div class="portal-card">
        <h3 style=${{ margin: "0 0 0.75rem" }}>Payment history</h3>
        ${pays.length === 0
          ? html`<p class="portal-empty">No payments found for this email yet.</p>`
          : html`<table class="portal-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Status</th><th>Ref</th></tr></thead>
              <tbody>
                ${pays.map((p) => html`<tr key=${p.id}>
                  <td>${String(p.paidAt || p.createdAt || "").slice(0, 10) || "—"}</td>
                  <td>₦${Number(p.amountPaid || p.amount || 0).toLocaleString()}</td>
                  <td><${Chip} status=${p.status || "paid"} /></td>
                  <td style=${{ fontSize: "0.75rem", color: "#64748b" }}>${p.reference || p.id}</td>
                </tr>`)}
              </tbody>
            </table>`}
      </div>
    `;
  } else if (section === "courses") {
    const list = (data && data.courses) || [];
    body = html`
      <div class="portal-card">
        <h3 style=${{ margin: "0 0 0.75rem" }}>My courses</h3>
        ${list.length === 0
          ? html`<p class="portal-empty">No courses published for your programme yet.</p>`
          : html`<table class="portal-table">
              <thead><tr><th>Code</th><th>Title</th></tr></thead>
              <tbody>
                ${list.map((c) => html`<tr key=${c.id}><td><code>${c.code || ""}</code></td><td>${c.title || "—"}</td></tr>`)}
              </tbody>
            </table>`}
      </div>
    `;
  } else if (section === "results") {
    const list = (data && data.grades) || [];
    body = html`
      <div class="portal-card">
        <h3 style=${{ margin: "0 0 0.75rem" }}>Results</h3>
        ${list.length === 0
          ? html`<p class="portal-empty">No published results yet.</p>`
          : html`<table class="portal-table">
              <thead><tr><th>Course</th><th>Grade</th><th>Score</th><th>Remark</th></tr></thead>
              <tbody>
                ${list.map((g) => html`<tr key=${g.id}>
                  <td><strong>${g.courseCode || ""}</strong> ${g.courseTitle || ""}</td>
                  <td>${g.grade || "—"}</td>
                  <td>${g.score != null ? g.score : "—"}</td>
                  <td style=${{ color: "#64748b", fontSize: "0.85rem" }}>${g.remark || ""}</td>
                </tr>`)}
              </tbody>
            </table>`}
      </div>
    `;
  } else {
    body = html`
      <div class="portal-card">
        <h3 style=${{ margin: "0 0 0.75rem" }}>Profile</h3>
        <div class="portal-meta">
          <div><span>Full name</span><strong>${name}</strong></div>
          <div><span>Email</span><strong>${user.email}</strong></div>
          <div><span>Reg number</span><strong>${reg}</strong></div>
          <div><span>Programme</span><strong>${program}</strong></div>
          <div><span>Phone</span><strong>${st && st.phone ? st.phone : "—"}</strong></div>
          <div><span>Cohort</span><strong>${st && (st.cohort || st.year) ? (st.cohort || st.year) : "—"}</strong></div>
        </div>
        <p class="portal-empty" style=${{ marginTop: "1rem" }}>Legal details (NIN, next of kin) are managed by the academy. Contact admissions to update them.</p>
      </div>
    `;
  }

  return html`
    <div class="cgtia-portal">
      <div class="portal-shell">
        <aside class="portal-sidebar">
          <div class="portal-brand"><span class="portal-brand-mark">C</span><span>CGTIA Portal</span></div>
          ${NAV.map((n) => navBtn(n.id, n.label, false))}
          <div style=${{ flex: 1 }}></div>
          <button type="button" class="portal-nav-btn" onClick=${logout}>Log out</button>
          <a href="/" class="portal-nav-btn" style=${{ textDecoration: "none" }}>Public site</a>
        </aside>
        <main class="portal-main">
          <div class="portal-top">
            <div>
              <h1>${section === "home" ? "Hello, " + String(name).split(" ")[0] : NAV.find((n) => n.id === section)?.label || "Portal"}</h1>
              <p>${section === "home" ? "Your student dashboard" : "CGTIA student portal"}</p>
            </div>
            <button type="button" class="portal-logout" onClick=${logout}>Log out</button>
          </div>
          ${loadErr ? html`<p class="portal-err">${loadErr}</p>` : null}
          ${body}
        </main>
      </div>
      <nav class="portal-bottom" aria-label="Portal">
        ${NAV.map((n) => navBtn(n.id, n.label, true))}
      </nav>
    </div>
  `;
}
