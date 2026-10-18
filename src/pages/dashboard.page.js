/**
 * CGTIA Student Portal
 * Desktop: sidebar dashboard · Mobile: top bar + drawer (no bottom nav)
 * Splash loading · first-visit onboarding · portal visibility flags
 */
import { createElement, useState, useEffect, useMemo } from "react";
import htm from "htm";
import { getFirebase } from "../services/firebase.service.js";

const html = htm.bind(createElement);

const NAV_ALL = [
  { id: "home", label: "Dashboard" },
  { id: "fees", label: "Fees" },
  { id: "courses", label: "Courses" },
  { id: "results", label: "Results" },
  { id: "profile", label: "Profile" }
];

const ONBOARD_KEY = "cgtia_portal_onboard_v1";

const ONBOARD_STEPS = [
  {
    emoji: "🎓",
    title: "Welcome to your CGTIA portal",
    body: "Track your programme, fees, courses, and results in one calm place — built for students on any phone."
  },
  {
    emoji: "📋",
    title: "Courses & results",
    body: "When your instructors publish grades, they appear under Results. Your module list lives under Courses."
  },
  {
    emoji: "💳",
    title: "Fees at a glance",
    body: "Payment history linked to your school email shows under Fees. Need help? Contact admissions."
  }
];

function Icon({ name }) {
  const paths = {
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "M6 6l12 12M18 6L6 18",
    home: "M3 10.5 12 3l9 7.5V21a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    fees: "M4 6h16v12H4zM4 10h16M8 14h4",
    courses: "M4 5h16v14H4zM8 9h8M8 13h6",
    results: "M5 19V9l7-4 7 4v10M9 19v-6h6v6",
    profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0",
    logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
  };
  return html`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"><path d=${paths[name] || paths.home} /></svg>`;
}

function Chip({ status }) {
  const s = String(status || "").toLowerCase();
  let cls = "chip chip-muted";
  if (/paid|complete|pass|active|published|ok/.test(s)) cls = "chip chip-ok";
  else if (/pend|due|partial|progress/.test(s)) cls = "chip chip-pending";
  return html`<span class=${cls}>${status || "—"}</span>`;
}

function ensureCss() {
  if (document.querySelector('link[data-portal-css]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/portal.css";
  link.setAttribute("data-portal-css", "1");
  document.head.appendChild(link);
}

async function firebaseAuth() {
  const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const authMod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const cfg = {
    apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
    authDomain: "verify-cgtia-cert.firebaseapp.com",
    projectId: "verify-cgtia-cert",
    storageBucket: "verify-cgtia-cert.firebasestorage.app",
    messagingSenderId: "766655761701",
    appId: "1:766655761701:web:45f559e0e38023439b5ecc"
  };
  const app = getApps().length ? getApp() : initializeApp(cfg);
  return { auth: authMod.getAuth(app), ...authMod };
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
    console.warn("student", e);
  }

  // Global portal visibility defaults
  let portalSettings = {
    showFees: true,
    showCourses: true,
    showResults: true,
    showProfile: true
  };
  try {
    const ps = await api.getDoc(api.doc(db, "siteContent", "portalSettings"));
    if (ps.exists()) portalSettings = { ...portalSettings, ...ps.data() };
  } catch (_) {}

  // Per-student overrides (false wins)
  if (student) {
    if (student.portalShowFees === false) portalSettings.showFees = false;
    if (student.portalShowCourses === false) portalSettings.showCourses = false;
    if (student.portalShowResults === false) portalSettings.showResults = false;
  }

  let courses = [];
  if (portalSettings.showCourses !== false) {
    try {
      const snap = await api.getDocs(api.collection(db, "courses"));
      snap.forEach((d) => {
        const c = { id: d.id, ...d.data() };
        if (c.active === false) return;
        if (student && student.program && c.program && String(c.program).toLowerCase() !== String(student.program).toLowerCase()) {
          // still allow if program empty
          if (student.program !== "all") return;
        }
        courses.push(c);
      });
      courses.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    } catch (e) {
      console.warn("courses", e);
    }
  }

  let grades = [];
  if (portalSettings.showResults !== false) {
    try {
      const snap = await api.getDocs(api.collection(db, "grades"));
      snap.forEach((d) => {
        const g = { id: d.id, ...d.data() };
        if (g.published === false) return;
        const match =
          (student && g.studentId === student.id) ||
          (g.studentEmail && String(g.studentEmail).toLowerCase() === email);
        if (match) grades.push(g);
      });
    } catch (e) {
      console.warn("grades", e);
    }
  }

  let payments = [];
  if (portalSettings.showFees !== false) {
    try {
      const snap = await api.getDocs(api.collection(db, "payments"));
      snap.forEach((d) => {
        const p = { id: d.id, ...d.data() };
        if (String(p.email || "").toLowerCase() === email) payments.push(p);
      });
    } catch (e) {
      console.warn("payments", e);
    }
  }

  return { student, courses, grades, payments, portalSettings };
}

function Splash() {
  return html`
    <div class="portal-splash">
      <div class="portal-splash-logo">C</div>
      <h1>CGTIA Portal</h1>
      <p>Preparing your space…</p>
      <div class="portal-spinner" aria-hidden="true"></div>
    </div>
  `;
}

function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const s = ONBOARD_STEPS[step];
  const last = step === ONBOARD_STEPS.length - 1;

  function finish() {
    try { localStorage.setItem(ONBOARD_KEY, "1"); } catch (_) {}
    onDone();
  }

  return html`
    <div class="portal-onboard">
      <div class="portal-onboard-stage">
        <div class="portal-onboard-art">${s.emoji}</div>
        <h2>${s.title}</h2>
        <p>${s.body}</p>
        <div class="portal-dots">
          ${ONBOARD_STEPS.map((_, i) => html`<i key=${i} class=${i === step ? "on" : ""} />`)}
        </div>
        ${last
          ? html`<button type="button" class="portal-btn portal-btn-primary" onClick=${finish}>Enter portal</button>`
          : html`
              <button type="button" class="portal-btn portal-btn-primary" onClick=${() => setStep(step + 1)}>Continue</button>
              <button type="button" class="portal-btn portal-btn-ghost" onClick=${finish}>Skip</button>
            `}
      </div>
    </div>
  `;
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
      const { auth, signInWithEmailAndPassword } = await firebaseAuth();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      onAuthed(cred.user);
    } catch (ex) {
      const code = ex && ex.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setErr("Email or password is incorrect. Use the password or one-time code sent after your payment.");
      } else if (code === "auth/too-many-requests") {
        setErr("Too many attempts. Wait a moment, then try again.");
      } else {
        setErr("Could not sign in. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return html`
    <div class="portal-gate-wrap">
      <div class="portal-gate">
        <div class="brand">
          <span class="mark">C</span>
          <strong>CGTIA Portal</strong>
        </div>
        <h1>Student sign in</h1>
        <p class="sub">Use the email from your application and the password or one-time code you received after payment.</p>
        <form onSubmit=${submit}>
          <div class="portal-field">
            <label>Email</label>
            <input type="email" required autocomplete="username" inputmode="email" value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="you@email.com" />
          </div>
          <div class="portal-field">
            <label>Password</label>
            <input type="password" required autocomplete="current-password" value=${password} onInput=${(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          ${err ? html`<p class="portal-err">${err}</p>` : null}
          <button type="submit" class="portal-btn portal-btn-primary" style=${{ marginTop: "0.75rem" }} disabled=${loading}>
            ${loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <a class="portal-link" href="/">← Back to website</a>
      </div>
    </div>
  `;
}

function NavButtons({ nav, section, setSection, onPick }) {
  return nav.map((n) => html`
    <button
      key=${n.id}
      type="button"
      class=${"portal-nav-btn" + (section === n.id ? " on" : "")}
      onClick=${() => { setSection(n.id); if (onPick) onPick(); }}
    >
      <${Icon} name=${n.id === "fees" ? "fees" : n.id === "courses" ? "courses" : n.id === "results" ? "results" : n.id === "profile" ? "profile" : "home"} />
      ${n.label}
    </button>
  `);
}

export function DashboardPage() {
  const [phase, setPhase] = useState("splash"); // splash | onboard | auth | app
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [section, setSection] = useState("home");
  const [drawer, setDrawer] = useState(false);
  const [loadErr, setLoadErr] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    ensureCss();
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      const minSplash = new Promise((r) => setTimeout(r, 900));
      try {
        const { auth, onAuthStateChanged } = await firebaseAuth();
        await minSplash;
        if (cancelled) return;
        unsub = onAuthStateChanged(auth, async (u) => {
          setUser(u);
          if (!u) {
            const seen = (() => { try { return localStorage.getItem(ONBOARD_KEY); } catch (_) { return "1"; } })();
            setPhase(seen ? "auth" : "onboard");
            setData(null);
            return;
          }
          setPhase("app");
          setRefreshing(true);
          try {
            const d = await loadPortalData(u);
            if (!cancelled) setData(d);
          } catch (e) {
            if (!cancelled) setLoadErr(e.message || "Could not load portal data");
          } finally {
            if (!cancelled) setRefreshing(false);
          }
        });
      } catch (e) {
        await minSplash;
        if (!cancelled) {
          setPhase("auth");
          setLoadErr(e.message || "Could not start portal");
        }
      }
    })();
    return () => { cancelled = true; try { unsub(); } catch (_) {} };
  }, []);

  const nav = useMemo(() => {
    const ps = (data && data.portalSettings) || {};
    return NAV_ALL.filter((n) => {
      if (n.id === "fees" && ps.showFees === false) return false;
      if (n.id === "courses" && ps.showCourses === false) return false;
      if (n.id === "results" && ps.showResults === false) return false;
      return true;
    });
  }, [data]);

  useEffect(() => {
    if (nav.length && !nav.find((n) => n.id === section)) setSection("home");
  }, [nav, section]);

  async function logout() {
    const { auth, signOut } = await firebaseAuth();
    await signOut(auth);
    setUser(null);
    setData(null);
    setPhase("auth");
    setDrawer(false);
  }

  if (phase === "splash") return html`<${Splash} />`;
  if (phase === "onboard") return html`<${Onboarding} onDone=${() => setPhase("auth")} />`;
  if (phase === "auth" || !user) return html`<${LoginGate} onAuthed=${(u) => { setUser(u); setPhase("app"); }} />`;

  const st = (data && data.student) || null;
  const name = st ? (st.fullLegalName || st.fullName || user.email) : user.email;
  const first = String(name || "Student").split(/\s+/)[0];
  const reg = st ? (st.regNumber || "—") : "—";
  const program = st ? (st.program || "—") : "—";
  const initial = String(name || "S").charAt(0).toUpperCase();
  const pays = (data && data.payments) || [];
  const paidTotal = pays.reduce((n, p) => n + (Number(p.amountPaid || p.amount) || 0), 0);
  const courses = (data && data.courses) || [];
  const grades = (data && data.grades) || [];
  const avgScore = (() => {
    const nums = grades.map((g) => Number(g.score)).filter((n) => !Number.isNaN(n));
    if (!nums.length) return null;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  })();

  const sectionTitle = (nav.find((n) => n.id === section) || {}).label || "Portal";

  let body = null;
  if (section === "home") {
    body = html`
      <div class="portal-hello">
        <h1>Hello, ${first}</h1>
        <p>${st ? "Here is your learning overview." : "Signed in — link your student record via admissions for full access."}</p>
      </div>
      <div class="portal-stats">
        <div class="portal-stat">
          <div class="lbl">Courses</div>
          <div class="val">${courses.length}</div>
        </div>
        <div class="portal-stat dark">
          <div class="lbl">Results published</div>
          <div class="val">${grades.length}</div>
        </div>
        <div class="portal-stat mint">
          <div class="lbl">${avgScore != null ? "Avg score" : "Fees paid"}</div>
          <div class="val">${avgScore != null ? avgScore : "₦" + paidTotal.toLocaleString()}</div>
        </div>
      </div>
      <div class="portal-card">
        <div class="portal-profile-row">
          ${st && st.photoUrl
            ? html`<img class="portal-avatar" src=${st.photoUrl} alt="" />`
            : html`<div class="portal-avatar ph">${initial}</div>`}
          <div class="portal-meta">
            <div><span>Name</span><strong>${name}</strong></div>
            <div><span>Reg number</span><strong>${reg}</strong></div>
            <div><span>Programme</span><strong>${program}</strong></div>
            <div><span>Status</span><strong><${Chip} status=${st && st.status ? st.status : (paidTotal > 0 ? "Active" : "Pending")} /></strong></div>
          </div>
        </div>
      </div>
      ${!st
        ? html`<div class="portal-promo">
            <h4>Complete your student link</h4>
            <p>Your login works, but no student record is tied to this email yet. Ask admissions to match your email on the student record — then courses, fees, and results will fill in.</p>
          </div>`
        : null}
      ${courses.length
        ? html`<div class="portal-card">
            <div class="portal-card-head">
              <h3>Your modules</h3>
              <button type="button" class="portal-btn portal-btn-ghost" style=${{ width: "auto", padding: "0.35rem 0.6rem", fontSize: "0.8rem" }} onClick=${() => setSection("courses")}>See all</button>
            </div>
            <ul class="portal-list">
              ${courses.slice(0, 5).map((c, i) => html`
                <li key=${c.id}>
                  <span class="num">${String(i + 1).padStart(2, "0")}</span>
                  <div class="body">
                    <strong>${c.title || c.code}</strong>
                    <span>${c.code || ""}</span>
                  </div>
                </li>
              `)}
            </ul>
          </div>`
        : null}
      ${grades.length
        ? html`<div class="portal-card">
            <div class="portal-card-head">
              <h3>Recent results</h3>
              <button type="button" class="portal-btn portal-btn-ghost" style=${{ width: "auto", padding: "0.35rem 0.6rem", fontSize: "0.8rem" }} onClick=${() => setSection("results")}>All</button>
            </div>
            <ul class="portal-list">
              ${grades.slice(0, 4).map((g) => html`
                <li key=${g.id}>
                  <span class="num">${g.grade || "·"}</span>
                  <div class="body">
                    <strong>${g.courseTitle || g.courseCode}</strong>
                    <span>${g.score != null ? "Score " + g.score : (g.remark || "Published")}</span>
                  </div>
                </li>
              `)}
            </ul>
          </div>`
        : html`<div class="portal-card">
            <h3>What’s next</h3>
            <p class="portal-empty">${st
              ? "When your instructors publish grades, they will show here and under Results."
              : "Contact admissions to link this account to your student file."}</p>
          </div>`}
    `;
  } else if (section === "fees") {
    body = html`
      <div class="portal-hello"><h1>Fees</h1><p>Payments linked to ${user.email}</p></div>
      <div class="portal-stats">
        <div class="portal-stat dark"><div class="lbl">Total recorded</div><div class="val">₦${paidTotal.toLocaleString()}</div></div>
        <div class="portal-stat"><div class="lbl">Transactions</div><div class="val">${pays.length}</div></div>
      </div>
      <div class="portal-card">
        ${pays.length === 0
          ? html`<p class="portal-empty">No payments found for this email yet.</p>`
          : html`<div class="portal-table-wrap"><table class="portal-table">
              <thead><tr><th>Date</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${pays.map((p) => html`<tr key=${p.id}>
                  <td>${String(p.paidAt || p.createdAt || "").toString().slice(0, 10) || "—"}</td>
                  <td>₦${Number(p.amountPaid || p.amount || 0).toLocaleString()}</td>
                  <td><${Chip} status=${p.status || "paid"} /></td>
                </tr>`)}
              </tbody>
            </table></div>`}
      </div>
    `;
  } else if (section === "courses") {
    body = html`
      <div class="portal-hello"><h1>Courses</h1><p>${program !== "—" ? "Track: " + program : "Your programme modules"}</p></div>
      <div class="portal-card">
        ${courses.length === 0
          ? html`<p class="portal-empty">No courses published for your programme yet.</p>`
          : html`<ul class="portal-list">
              ${courses.map((c, i) => html`
                <li key=${c.id}>
                  <span class="num">${String(i + 1).padStart(2, "0")}</span>
                  <div class="body">
                    <strong>${c.title || "—"}</strong>
                    <span>${c.code || ""}${c.description ? " · " + c.description : ""}</span>
                  </div>
                </li>
              `)}
            </ul>`}
      </div>
    `;
  } else if (section === "results") {
    body = html`
      <div class="portal-hello"><h1>Results</h1><p>Only published grades are shown</p></div>
      <div class="portal-card">
        ${grades.length === 0
          ? html`<p class="portal-empty">No published results yet.</p>`
          : html`<div class="portal-table-wrap"><table class="portal-table">
              <thead><tr><th>Course</th><th>Grade</th><th>Score</th></tr></thead>
              <tbody>
                ${grades.map((g) => html`<tr key=${g.id}>
                  <td><strong>${g.courseCode || ""}</strong> ${g.courseTitle || ""}</td>
                  <td>${g.grade || "—"}</td>
                  <td>${g.score != null ? g.score : "—"}</td>
                </tr>`)}
              </tbody>
            </table></div>`}
      </div>
    `;
  } else {
    body = html`
      <div class="portal-hello"><h1>Profile</h1><p>Your academy record</p></div>
      <div class="portal-card">
        <div class="portal-profile-row" style=${{ marginBottom: "1rem" }}>
          ${st && st.photoUrl
            ? html`<img class="portal-avatar" src=${st.photoUrl} alt="" />`
            : html`<div class="portal-avatar ph">${initial}</div>`}
          <div>
            <strong style=${{ fontSize: "1.1rem" }}>${name}</strong>
            <p style=${{ margin: "0.25rem 0 0", color: "var(--p-muted)", fontSize: "0.9rem" }}>${user.email}</p>
          </div>
        </div>
        <div class="portal-meta">
          <div><span>Reg number</span><strong>${reg}</strong></div>
          <div><span>Programme</span><strong>${program}</strong></div>
          <div><span>Phone</span><strong>${st && st.phone ? st.phone : "—"}</strong></div>
          <div><span>Cohort</span><strong>${st && (st.cohort || st.year) ? (st.cohort || st.year) : "—"}</strong></div>
        </div>
        <p class="portal-empty" style=${{ marginTop: "1rem" }}>Legal fields (NIN, next of kin) are managed by the academy. Contact admissions to update them.</p>
      </div>
    `;
  }

  const userBlock = html`
    <div class="portal-user-card">
      ${st && st.photoUrl
        ? html`<img src=${st.photoUrl} alt="" />`
        : html`<div class="av">${initial}</div>`}
      <div>
        <div class="nm">${name}</div>
        <div class="rl">Student</div>
      </div>
    </div>
  `;

  return html`
    <div class="cgtia-portal">
      <div class="portal-shell">
        <aside class="portal-sidebar">
          <div class="portal-brand"><span class="mark">C</span> CGTIA Portal</div>
          ${userBlock}
          <${NavButtons} nav=${nav} section=${section} setSection=${setSection} />
          <div class="portal-nav-spacer"></div>
          <button type="button" class="portal-nav-btn" onClick=${logout}><${Icon} name="logout" /> Log out</button>
          <a href="/" class="portal-nav-btn" style=${{ textDecoration: "none" }}>Public site</a>
        </aside>

        <div style=${{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <header class="portal-topbar">
            <button type="button" class="portal-icon-btn" aria-label="Menu" onClick=${() => setDrawer(true)}><${Icon} name="menu" /></button>
            <span class="title">${sectionTitle}</span>
            <button type="button" class="portal-icon-btn" aria-label="Log out" onClick=${logout}><${Icon} name="logout" /></button>
          </header>

          <main class="portal-main">
            <div class="portal-main-inner">
              ${loadErr ? html`<p class="portal-err">${loadErr}</p>` : null}
              ${refreshing && !data ? html`<p class="portal-empty">Loading your data…</p>` : body}
            </div>
          </main>
        </div>
      </div>

      <div class=${"portal-drawer-bg" + (drawer ? " open" : "")} onClick=${() => setDrawer(false)}></div>
      <aside class=${"portal-drawer" + (drawer ? " open" : "")} aria-hidden=${!drawer}>
        <div class="portal-brand" style=${{ justifyContent: "space-between" }}>
          <span style=${{ display: "flex", alignItems: "center", gap: "0.5rem" }}><span class="mark">C</span> Menu</span>
          <button type="button" class="portal-icon-btn" aria-label="Close" onClick=${() => setDrawer(false)}><${Icon} name="close" /></button>
        </div>
        ${userBlock}
        <${NavButtons} nav=${nav} section=${section} setSection=${setSection} onPick=${() => setDrawer(false)} />
        <div class="portal-nav-spacer"></div>
        <button type="button" class="portal-nav-btn" onClick=${logout}><${Icon} name="logout" /> Log out</button>
        <a href="/" class="portal-nav-btn" style=${{ textDecoration: "none" }} onClick=${() => setDrawer(false)}>Public site</a>
      </aside>
    </div>
  `;
}
