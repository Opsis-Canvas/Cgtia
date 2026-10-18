/**
 * CGTIA Student Portal — EasyKorean layout language, CGTIA brand
 */
import { createElement, useEffect, useMemo, useState } from "react";
import htm from "htm";
import { getFirebase } from "../services/firebase.service.js";
import { OnboardingView } from "./portal/onboarding.view.js";
import { OnboardingDesktop } from "./portal/onboarding-desktop.view.js";
import { DesktopView } from "./portal/desktop.view.js";
import { MobileView } from "./portal/mobile.view.js";
import { Skeleton } from "./portal/shared.js";

const html = htm.bind(createElement);
const DESKTOP_QUERY = "(min-width: 860px)";
const ONBOARD_KEY = "cgtia_portal_onboard_v2";

const NAV_ALL = [
  { id: "dashboard", label: "Dashboard", icon: "grid" },
  { id: "courses", label: "Courses", icon: "book" },
  { id: "assessments", label: "Tests", icon: "cal" },
  { id: "grades", label: "My grades", icon: "chart" },
  { id: "fees", label: "Fees", icon: "card" },
  { id: "profile", label: "Profile", icon: "user" }
];

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof matchMedia !== "undefined" ? matchMedia(DESKTOP_QUERY).matches : true
  );
  useEffect(() => {
    const mq = matchMedia(DESKTOP_QUERY);
    const onChange = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return isDesktop;
}

function ensureCss() {
  if (document.querySelector("link[data-portal-css]")) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "/css/portal.css";
  link.setAttribute("data-portal-css", "1");
  document.head.appendChild(link);
  // Montserrat / Inter if available on public site; else system stack in CSS
  if (!document.querySelector("link[data-portal-fonts]")) {
    const f = document.createElement("link");
    f.rel = "stylesheet";
    f.href = "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700;800;900&display=swap";
    f.setAttribute("data-portal-fonts", "1");
    document.head.appendChild(f);
  }
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
  let row = null;
  try {
    const q = api.query(api.collection(db, "students"), api.where("email", "==", email));
    const snap = await api.getDocs(q);
    snap.forEach((d) => {
      if (!row && d.data().trashed !== true) row = { id: d.id, ...d.data() };
    });
  } catch (e) {
    console.warn(e);
  }

  let portalSettings = { showFees: true, showCourses: true, showResults: true };
  try {
    const ps = await api.getDoc(api.doc(db, "siteContent", "portalSettings"));
    if (ps.exists()) portalSettings = { ...portalSettings, ...ps.data() };
  } catch (_) {}
  if (row) {
    if (row.portalShowFees === false) portalSettings.showFees = false;
    if (row.portalShowCourses === false) portalSettings.showCourses = false;
    if (row.portalShowResults === false) portalSettings.showResults = false;
  }

  let courses = [];
  if (portalSettings.showCourses !== false) {
    try {
      const snap = await api.getDocs(api.collection(db, "courses"));
      snap.forEach((d) => {
        const c = { id: d.id, ...d.data() };
        if (c.active === false) return;
        if (row && row.program && c.program && String(c.program).toLowerCase() !== String(row.program).toLowerCase()) return;
        courses.push(c);
      });
      courses.sort((a, b) => (Number(a.sortOrder) || 0) - (Number(b.sortOrder) || 0));
    } catch (e) {
      console.warn(e);
    }
  }

  let grades = [];
  if (portalSettings.showResults !== false) {
    try {
      const snap = await api.getDocs(api.collection(db, "grades"));
      snap.forEach((d) => {
        const g = { id: d.id, ...d.data() };
        if (g.published === false) return;
        const match = (row && g.studentId === row.id) || (g.studentEmail && String(g.studentEmail).toLowerCase() === email);
        if (match) grades.push(g);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  let payments = [];
  if (portalSettings.showFees !== false) {
    try {
      const seen = new Set();
      const addSnap = (snap) => {
        snap.forEach((d) => {
          if (seen.has(d.id)) return;
          seen.add(d.id);
          payments.push({ id: d.id, ...d.data() });
        });
      };
      // Fee-link + online + cash that stored this email
      addSnap(await api.getDocs(api.query(api.collection(db, "payments"), api.where("email", "==", email))));
      // Cash / fee-link tied to student record id
      if (row && row.id) {
        try {
          addSnap(await api.getDocs(api.query(api.collection(db, "payments"), api.where("studentId", "==", row.id))));
        } catch (_) {}
      }
      // Same reg number (walk-in cash sometimes uses reg more than email)
      if (row && row.regNumber) {
        try {
          addSnap(await api.getDocs(api.query(api.collection(db, "payments"), api.where("regNumber", "==", row.regNumber))));
        } catch (_) {}
      }
    } catch (e) {
      console.warn("payments load", e);
    }
  }

  let assessments = [];
  try {
    const snap = await api.getDocs(api.collection(db, "assessments"));
    snap.forEach((d) => {
      const a = { id: d.id, ...d.data() };
      if (a.active === false) return;
      if (row && row.program && a.program && String(a.program).toLowerCase() !== String(row.program).toLowerCase()) return;
      assessments.push(a);
    });
  } catch (e) {
    console.warn(e);
  }

  let announcements = [];
  try {
    // Prefer promotions/announcements already used on the public site
    const snap = await api.getDocs(api.collection(db, "promotions"));
    snap.forEach((d) => {
      const a = { id: d.id, ...d.data() };
      if (a.active === false || a.paused === true) return;
      const kind = String(a.kind || a.type || "").toLowerCase();
      if (kind && kind.indexOf("ann") === -1 && a.channel !== "announcement") {
        // still allow if marked showInPortal
        if (a.showInPortal !== true) return;
      }
      announcements.push({
        title: a.title || a.headline || "Announcement",
        body: a.body || a.message || a.fullMessage || a.text || "",
        id: d.id
      });
    });
  } catch (e) {
    console.warn(e);
  }

  const student = {
    id: row?.id,
    name: row ? (row.fullLegalName || row.fullName || user.email) : user.email,
    email,
    role: row ? (row.program ? String(row.program) + " student" : "Student") : "Student",
    avatar: row?.photoUrl || "",
    reg: row?.regNumber || "",
    program: row?.program || "",
    phone: row?.phone || "",
    cohort: row?.cohort || row?.year || "",
    status: row?.status || "",
    startDate: row?.startDate || "",
    certificateCode: row?.certificateCode || "",
    profileCompleted: !!row?.profileCompleted,
    nextOfKin: row?.nextOfKinName || (row?.nextOfKin && row.nextOfKin.name) || ""
  };

  return { student, courses, grades, payments, assessments, announcements, portalSettings, linked: !!row };
}

function BrandLoading({ isDesktop }) {
  return isDesktop
    ? html`<${OnboardingDesktop} mode="loading" />`
    : html`<${OnboardingView} mode="loading" />`;
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
        setErr("That email or password does not match. Use the password or one-time code sent after payment.");
      } else if (code === "auth/too-many-requests") {
        setErr("Too many tries. Wait a minute, then try again.");
      } else {
        setErr("Could not sign in right now. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return html`<div class="auth-wrap">
    <div class="auth-card">
      <span class="brand">CGTIA</span>
      <h1>Student sign in</h1>
      <p class="sub">Use the email from your application and the password or one-time code you received after payment.</p>
      <form onSubmit=${submit}>
        <label>Email</label>
        <input type="email" required autocomplete="username" value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="you@email.com" />
        <label>Password</label>
        <input type="password" required autocomplete="current-password" value=${password} onInput=${(e) => setPassword(e.target.value)} placeholder="••••••••" />
        ${err ? html`<p class="err">${err}</p>` : null}
        <button type="submit" class="pill-ink" disabled=${loading}>${loading ? "Signing in…" : "Sign in"}</button>
      </form>
      <p style=${{ marginTop: 16, fontSize: 13 }}><a href="/" style=${{ color: "var(--muted)" }}>← Back to website</a></p>
    </div>
  </div>`;
}

export function DashboardPage() {
  const isDesktop = useIsDesktop();
  const [phase, setPhase] = useState("splash");
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [section, setSection] = useState("dashboard");

  useEffect(() => {
    ensureCss();
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      const wait = new Promise((r) => setTimeout(r, 700));
      try {
        const { auth, onAuthStateChanged } = await firebaseAuth();
        await wait;
        if (cancelled) return;
        unsub = onAuthStateChanged(auth, async (u) => {
          setUser(u);
          if (!u) {
            let seen = "1";
            try { seen = localStorage.getItem(ONBOARD_KEY); } catch (_) {}
            setPhase(seen ? "auth" : "onboard");
            setData(null);
            return;
          }
          setPhase("app");
          try {
            const d = await loadPortalData(u);
            if (!cancelled) setData(d);
          } catch (e) {
            console.warn(e);
            if (!cancelled) setData({ student: { name: u.email, email: u.email, role: "Student" }, courses: [], grades: [], payments: [], portalSettings: {}, linked: false });
          }
        });
      } catch (e) {
        await wait;
        if (!cancelled) setPhase("auth");
      }
    })();
    return () => { cancelled = true; try { unsub(); } catch (_) {} };
  }, []);

  const nav = useMemo(() => {
    const ps = (data && data.portalSettings) || {};
    return NAV_ALL.filter((n) => {
      if (n.id === "fees" && ps.showFees === false) return false;
      if (n.id === "courses" && ps.showCourses === false) return false;
      if (n.id === "grades" && ps.showResults === false) return false;
      return true;
    });
  }, [data]);

  useEffect(() => {
    if (nav.length && !nav.find((n) => n.id === section)) setSection("dashboard");
  }, [nav, section]);

  async function logout() {
    const { auth, signOut } = await firebaseAuth();
    await signOut(auth);
    setUser(null);
    setData(null);
    setPhase("auth");
  }

  if (phase === "splash") return html`<${BrandLoading} isDesktop=${isDesktop} />`;
  if (phase === "onboard") {
    const done = () => {
      try { localStorage.setItem(ONBOARD_KEY, "1"); } catch (_) {}
      setPhase("auth");
    };
    return isDesktop
      ? html`<${OnboardingDesktop} mode="welcome" onStart=${done} />`
      : html`<${OnboardingView} mode="welcome" onStart=${done} />`;
  }
  if (phase === "auth" || !user) {
    return html`<${LoginGate} onAuthed=${(u) => { setUser(u); setPhase("app"); }} />`;
  }

  if (phase === "app" && !data) {
    return html`<div class=${isDesktop ? "d-main" : "m-app"} style=${{ padding: isDesktop ? "48px 32px" : undefined }}>
      <${Skeleton} rows=${4} />
    </div>`;
  }

  const courses = (data && data.courses) || [];
  const grades = (data && data.grades) || [];
  const payments = (data && data.payments) || [];
  const paidTotal = payments.reduce((n, p) => n + (Number(p.amountPaid || p.amount) || 0), 0);
  const avg = (() => {
    const nums = grades.map((g) => Number(g.score)).filter((n) => !Number.isNaN(n));
    if (!nums.length) return null;
    return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
  })();

  const stats = isDesktop
    ? [
        { id: "courses", value: courses.length, total: courses.length || null, label: "Courses on your track", tone: "mist" },
        { id: "grades", value: grades.length, total: null, label: "Published results", tone: "ink" },
        { id: "score", value: avg != null ? avg : "—", total: avg != null ? 100 : null, label: avg != null ? "Average score" : "Awaiting scores", tone: "lime" }
      ]
    : [
        { id: "courses", value: courses.length, label: "Courses on your track", icon: "book", tall: true },
        { id: "grades", value: grades.length, label: "Published results", icon: "chart" },
        { id: "fees", value: avg != null ? avg : "₦" + (paidTotal >= 1000 ? Math.round(paidTotal / 1000) + "k" : paidTotal), label: avg != null ? "Average score" : "Fees recorded", icon: "card" }
      ];

  // Fix desktop stats - total null shows ugly - adjust StatCard already handles total != null
  const deskStats = [
    { id: "c", value: String(courses.length), label: "Courses on your track", tone: "mist" },
    { id: "g", value: String(grades.length), label: "Published results", tone: "ink" },
    { id: "s", value: avg != null ? String(avg) : "—", total: avg != null ? 100 : null, label: avg != null ? "Average score" : "Awaiting scores", tone: "lime" }
  ];

  const ctx = {
    student: (data && data.student) || { name: user.email, email: user.email, role: "Student" },
    nav,
    section,
    setSection,
    stats: isDesktop ? deskStats : stats,
    courses,
    grades,
    payments,
    paidTotal,
    onLogout: logout,
    linked: !!(data && data.linked),
    announcements: (data && data.announcements) || [],
    assessments: (data && data.assessments) || []
  };

  return isDesktop
    ? html`<${DesktopView} ctx=${ctx} />`
    : html`<${MobileView} ctx=${ctx} />`;
}
