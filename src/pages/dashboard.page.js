/**
 * CGTIA Student Portal — EasyKorean layout language, CGTIA brand
 */
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  { id: "schedule", label: "Schedule", icon: "cal" },
  { id: "assessments", label: "Tests", icon: "book" },
  { id: "grades", label: "My grades", icon: "chart" },
  { id: "transcript", label: "Transcript", icon: "chart" },
  { id: "attendance", label: "Attendance", icon: "check" },
  { id: "certificates", label: "Certificates", icon: "card" },
  { id: "messages", label: "Messages", icon: "mail" },
  { id: "fees", label: "Fees", icon: "card" },
  { id: "settings", label: "Settings", icon: "gear" },
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
  link.href = "/css/portal.css?v=r6";  // version tag forces fresh CSS on phones that cached the old file
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
      const seen = new Set();
      const addGradeSnap = (snap) => {
        if (!snap) return;
        snap.forEach((d) => {
          if (seen.has(d.id)) return;
          seen.add(d.id);
          const g = { id: d.id, ...d.data() };
          if (g.published === false) return;
          grades.push(g);
        });
      };
      // Security rules require published == true for student reads.
      // Query MUST include that filter or Firestore rejects the whole query.
      const tryQ = async (constraints) => {
        try {
          return await api.getDocs(api.query(api.collection(db, "grades"), ...constraints));
        } catch (e) {
          console.warn("grades query", e && e.message ? e.message : e);
          return null;
        }
      };
      if (email) {
        addGradeSnap(await tryQ([
          api.where("studentEmail", "==", email),
          api.where("published", "==", true)
        ]));
        // Fallback if index missing: email only then filter client-side (may fail under strict rules)
        if (!grades.length) {
          addGradeSnap(await tryQ([api.where("studentEmail", "==", email)]));
        }
      }
      if (row && row.id && !grades.length) {
        addGradeSnap(await tryQ([
          api.where("studentId", "==", row.id),
          api.where("published", "==", true)
        ]));
        if (!grades.length) {
          addGradeSnap(await tryQ([api.where("studentId", "==", row.id)]));
        }
      }
      grades = grades.filter((g) => g.published !== false);
    } catch (e) {
      console.warn("grades load", e);
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
  let promos = [];
  try {
    const snap = await api.getDocs(api.collection(db, "promotions"));
    const now = Date.now();
    snap.forEach((d) => {
      const a = { id: d.id, ...d.data() };
      // Respect admin pause / hibernate / stop / trash
      if (a.trashed === true) return;
      if (a.active === false || a.paused === true || a.hibernated === true) return;
      if (a.endsAt) {
        const end = a.endsAt.toMillis ? a.endsAt.toMillis() : new Date(a.endsAt).getTime();
        if (end && end < now) return;
      }
      // Portal only — never pull main-site-only campaigns into the student app
      if (a.showInPortal !== true) return;
      const kind = String(a.type || a.kind || "").toLowerCase();
      const item = {
        id: d.id,
        title: a.title || a.headline || "Notice",
        body: a.description || a.body || a.message || a.fullMessage || a.bellText || a.text || "",
        linkUrl: a.linkUrl || a.bellButtonUrl || "",
        linkLabel: a.linkLabel || a.bellButtonLabel || a.ctaLabel || "Open",
        kind,
        badge: a.badge || "",
        promoAmount: a.promoAmount || "",
        imageUrl: a.imageUrl || a.graphicUrl || a.bannerUrl || "",
        imageMobile: a.imageMobile || "",
        imageDesktop: a.imageDesktop || "",
        linkLabelResolved: a.linkLabel || "",
        ctaLabel: a.ctaLabel || a.linkLabel || a.bellButtonLabel || "Know more"
      };
      if (kind === "tuition" || kind === "promo" || kind === "promotion") {
        promos.push(item);
      } else {
        announcements.push(item);
      }
    });
  } catch (e) {
    console.warn(e);
  }

  let slides = [];
  try {
    const snap = await api.getDocs(api.collection(db, "dashboardSlides"));
    snap.forEach((d) => {
      const a = { id: d.id, ...d.data() };
      if (a.trashed === true || a.active === false) return;
      slides.push({
        id: d.id,
        title: a.title || "",
        body: a.body || "",
        ctaLabel: a.ctaLabel || "Learn more",
        ctaUrl: a.ctaUrl || "",
        kind: a.kind === "card" ? "card" : "design",
        imageMobile: a.imageMobile || "",
        imageDesktop: a.imageDesktop || "",
        bgMobile: a.bgMobile || "",
        bgDesktop: a.bgDesktop || "",
        placeholder: a.placeholder || "",
        order: Number(a.order) || 0
      });
    });
    slides.sort((x, y) => x.order - y.order);
  } catch (e) { console.warn(e); }

  let certificates = [];
  try {
    if (row) {
      const snaps = [];
      try {
        snaps.push(await api.getDocs(api.query(api.collection(db, "certificates"), api.where("email", "==", email))));
      } catch (_) {}
      try {
        if (row.id) snaps.push(await api.getDocs(api.query(api.collection(db, "certificates"), api.where("studentId", "==", row.id))));
      } catch (_) {}
      const seen = new Set();
      snaps.forEach((snap) => {
        snap.forEach((d) => {
          if (seen.has(d.id)) return;
          seen.add(d.id);
          const c = { id: d.id, ...d.data() };
          if (c.trashed === true) return;
          certificates.push(c);
        });
      });
    }
    // synthetic from student record if no cert docs
    if (!certificates.length && row && (row.certificateCode || row.idCardStatus || row.licenseStatus)) {
      certificates.push({
        id: "student-record",
        type: "record",
        title: "Academy credentials",
        certificateCode: row.certificateCode || "",
        idCardStatus: row.idCardStatus || row.idCard || "",
        licenseStatus: row.licenseStatus || "",
        status: row.certificateStatus || (row.certificateCode ? "issued" : "pending")
      });
    }
  } catch (e) { console.warn(e); }

  let attendance = [];
  try {
    if (row) {
      try {
        const snap = await api.getDocs(api.query(api.collection(db, "attendance"), api.where("email", "==", email)));
        snap.forEach((d) => attendance.push({ id: d.id, ...d.data() }));
      } catch (_) {}
      if (!attendance.length && row.id) {
        try {
          const snap = await api.getDocs(api.query(api.collection(db, "attendance"), api.where("studentId", "==", row.id)));
          snap.forEach((d) => attendance.push({ id: d.id, ...d.data() }));
        } catch (_) {}
      }
      attendance.sort((a, b) => String(b.date || b.sessionDate || "").localeCompare(String(a.date || a.sessionDate || "")));
    }
  } catch (e) { console.warn(e); }

  let schedule = [];
  try {
    const snap = await api.getDocs(api.collection(db, "schedule"));
    snap.forEach((d) => {
      const s = { id: d.id, ...d.data() };
      if (s.active === false || s.trashed === true) return;
      if (row && row.program && s.program && String(s.program).toLowerCase() !== String(row.program).toLowerCase()) return;
      schedule.push(s);
    });
    schedule.sort((a, b) => String(a.dayOrder || a.day || "").localeCompare(String(b.dayOrder || b.day || "")) || String(a.startTime || "").localeCompare(String(b.startTime || "")));
  } catch (e) { console.warn(e); }

  let notifications = [];
  try {
    const snaps = [];
    try {
      snaps.push(await api.getDocs(api.query(api.collection(db, "portalNotifications"), api.where("audience", "==", "all"))));
    } catch (_) {}
    if (email) {
      try {
        snaps.push(await api.getDocs(api.query(api.collection(db, "portalNotifications"), api.where("email", "==", email))));
      } catch (_) {}
    }
    if (row && row.program) {
      try {
        snaps.push(await api.getDocs(api.query(api.collection(db, "portalNotifications"), api.where("program", "==", row.program))));
      } catch (_) {}
    }
    const seen = new Set();
    snaps.forEach((snap) => {
      snap.forEach((d) => {
        if (seen.has(d.id)) return;
        seen.add(d.id);
        const n = { id: d.id, ...d.data() };
        if (n.active === false || n.trashed === true) return;
        notifications.push(n);
      });
    });
    notifications.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
  } catch (e) { console.warn(e); }

  let messages = [];
  try {
    if (email) {
      try {
        const snap = await api.getDocs(api.query(api.collection(db, "supportMessages"), api.where("email", "==", email)));
        snap.forEach((d) => messages.push({ id: d.id, ...d.data() }));
      } catch (_) {}
      messages.sort((a, b) => {
        const ta = a.createdAt && a.createdAt.toMillis ? a.createdAt.toMillis() : 0;
        const tb = b.createdAt && b.createdAt.toMillis ? b.createdAt.toMillis() : 0;
        return tb - ta;
      });
    }
  } catch (e) { console.warn(e); }

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

  return { student, courses, grades, payments, assessments, announcements, promos, slides, certificates, attendance, schedule, messages, notifications, portalSettings, linked: !!row };
}

function BrandLoading() {
  // One splash for every screen size: navy, pulsing mark, swiping placeholder
  return html`<${OnboardingView} mode="loading" />`;
}

function LoginGate({ onAuthed }) {
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  function toggleShowPw(e) {
    e.preventDefault();
    e.stopPropagation();
    const el = passwordRef.current;
    // Capture real DOM value before React re-renders the input type
    const kept = el ? el.value : "";
    setShowPw((v) => !v);
    // Restore after type switch (controlled-value / autofill safe)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (passwordRef.current) {
          passwordRef.current.value = kept;
          try { passwordRef.current.focus(); } catch (_) {}
        }
      });
    });
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    // Always read from the DOM — never trust React state for passwords
    const em = String(emailRef.current && emailRef.current.value != null ? emailRef.current.value : "").trim();
    const pw = String(passwordRef.current && passwordRef.current.value != null ? passwordRef.current.value : "");
    if (!em) {
      setErr("Enter the email you used with the academy.");
      return;
    }
    if (!pw) {
      setErr("Enter your password or one-time code, then tap Sign in.");
      return;
    }
    setLoading(true);
    try {
      const { auth, signInWithEmailAndPassword } = await firebaseAuth();
      await signInWithEmailAndPassword(auth, em, pw);
      // onAuthStateChanged will move phase to app; still notify parent
      const user = auth.currentUser;
      if (user) onAuthed(user);
    } catch (ex) {
      const code = ex && ex.code;
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found" || code === "auth/invalid-email") {
        setErr("That email or password does not match. Check both fields and try again.");
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
      <div class="auth-logo-row">
        <img src="/assets/brand/cgtia-logo.webp" alt="CGTIA" width="48" height="48" />
        <span class="brand">CGTIA</span>
      </div>
      <h1>Student sign in</h1>
      <p class="sub">Use the email from your application and the password or one-time code you received after payment.</p>
      <form onSubmit=${submit} autoComplete="on" method="post" action="#">
        <label for="cgtia-email">Email</label>
        <input id="cgtia-email" name="email" type="email" required
          autocomplete="username" placeholder="you@email.com"
          ref=${emailRef} defaultValue="" />
        <label for="cgtia-password">Password</label>
        <div class="pw-field">
          <input id="cgtia-password" name="password" type=${showPw ? "text" : "password"} required
            autocomplete="current-password" placeholder="••••••••"
            ref=${passwordRef} defaultValue="" />
          <button type="button" class="pw-toggle"
            aria-label=${showPw ? "Hide password" : "Show password"}
            onMouseDown=${(e) => e.preventDefault()}
            onClick=${toggleShowPw}>
            ${showPw ? "Hide" : "Show"}
          </button>
        </div>
        ${err ? html`<div class="status-banner is-error" role="alert"><span aria-hidden="true">!</span><span>${err}</span></div>` : null}
        <button type="submit" class="pill-ink" disabled=${loading}>${loading ? "Signing in…" : "Sign in"}</button>
      </form>
      <p style=${{ marginTop: 16, fontSize: 13 }}><a href="/" style=${{ color: "var(--muted)" }}>← Back to website</a></p>
    </div>
  </div>`;
}

export function DashboardPage() {
  const isDesktop = useIsDesktop();
  // Night mode is the default for the student portal. Only an explicit "light" choice (made in Settings) turns it off.
  useEffect(() => {
    const applyTheme = () => {
      let v = null;
      try { v = localStorage.getItem("cgtia_theme"); } catch (_) {}
      if (v !== "light") { try { localStorage.setItem("cgtia_theme", "dark"); } catch (_) {} }
      document.documentElement.setAttribute("data-theme", v === "light" ? "light" : "dark");
    };
    // Leaving the dashboard (back button, link, or hiding the page) must hand the public site back its own colours
    const clearTheme = () => { try { document.documentElement.removeAttribute("data-theme"); } catch (_) {} };
    // Coming back to the dashboard from the back-forward cache: restore the portal theme
    const onShow = (e) => { if (e.persisted) applyTheme(); };
    applyTheme();
    window.addEventListener("pagehide", clearTheme);
    window.addEventListener("pageshow", onShow);
    return () => {
      window.removeEventListener("pagehide", clearTheme);
      window.removeEventListener("pageshow", onShow);
      clearTheme();
    };
  }, []);
  useEffect(() => {
    document.body.classList.add("is-portal");
    return () => document.body.classList.remove("is-portal");
  }, []);
  const [phase, setPhase] = useState("splash");
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [section, setSection] = useState(() => {
    try {
      const h = (location.hash || "").replace(/^#\/?/, "");
      return h || "dashboard";
    } catch (_) { return "dashboard"; }
  });
  const [exitOpen, setExitOpen] = useState(false);

  useEffect(() => {
    ensureCss();
    let unsub = () => {};
    let cancelled = false;
    (async () => {
      // Hold branded loading at least ~3.5s so the screen is readable
      const minSplash = new Promise((r) => setTimeout(r, 3500));
      try {
        const { auth, onAuthStateChanged } = await firebaseAuth();
        let pendingUser = null;
        let authReady = false;
        unsub = onAuthStateChanged(auth, async (u) => {
          pendingUser = u;
          authReady = true;
          setUser(u);
          if (!u) {
            await minSplash;
            if (cancelled) return;
            let seen = "1";
            try { seen = localStorage.getItem(ONBOARD_KEY); } catch (_) {}
            setPhase(seen ? "auth" : "onboard");
            setData(null);
            return;
          }
          try {
            const d = await loadPortalData(u);
            await minSplash;
            if (cancelled) return;
            setData(d);
            setPhase("app");
          } catch (e) {
            console.warn(e);
            await minSplash;
            if (cancelled) return;
            setData({ student: { name: u.email, email: u.email, role: "Student" }, courses: [], grades: [], payments: [], portalSettings: {}, linked: false });
            setPhase("app");
          }
        });
        // Safety: if auth is slow, still leave splash after min time once auth fires
        await minSplash;
        if (cancelled) return;
        if (authReady && !pendingUser) {
          let seen = "1";
          try { seen = localStorage.getItem(ONBOARD_KEY); } catch (_) {}
          setPhase(seen ? "auth" : "onboard");
        }
      } catch (e) {
        await minSplash;
        if (!cancelled) setPhase("auth");
      }
    })();
    return () => { cancelled = true; try { unsub(); } catch (_) {} };
  }, []);

  const navigateSection = useCallback((next) => {
    const target = next || "dashboard";
    setSection((prev) => {
      if (prev === target) return prev;
      try {
        history.pushState({ portal: true, section: target }, "", "#/" + encodeURIComponent(target));
      } catch (_) {}
      return target;
    });
  }, []);

  useEffect(() => {
    // Seed history so first back stays in portal
    try {
      if (!history.state || !history.state.portal) {
        history.replaceState({ portal: true, section }, "", "#/" + encodeURIComponent(section || "dashboard"));
      }
    } catch (_) {}
  }, []);

  useEffect(() => {
    const onPop = (e) => {
      const st = e.state;
      if (st && st.portal && st.section) {
        setSection(st.section);
        return;
      }
      // Left portal stack — offer exit instead of dumping to public site immediately
      try {
        history.pushState({ portal: true, section: "dashboard" }, "", "#/dashboard");
      } catch (_) {}
      setSection("dashboard");
      setExitOpen(true);
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
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
    // Keep list tabs in nav; allow detail routes (module / lesson / test / notice)
    if (!nav.length) return;
    if (nav.find((n) => n.id === section)) return;
    if (/^(course|lesson|test|notice|fees|receipt|lcheck|mquiz|grade):/.test(String(section || ""))) return;
    if (/^(schedule|attendance|certificates|messages|transcript|settings)$/.test(String(section || ""))) return;
    setSection("dashboard");
  }, [nav, section]);

  async function logout() {
    const { auth, signOut } = await firebaseAuth();
    await signOut(auth);
    setUser(null);
    setData(null);
    setPhase("auth");
  }

  if (phase === "splash") return html`<${BrandLoading} />`;

  const exitModal = exitOpen ? html`<div class="exit-scrim" role="dialog" aria-modal="true" aria-label="Leave CareEd">
    <div class="exit-card">
      <h3>Leave CareEd?</h3>
      <p>You can come back anytime with the same email and password.</p>
      <button type="button" class="btn-block" onClick=${() => setExitOpen(false)}>Stay in CareEd</button>
      <button type="button" class="btn-block secondary" style=${{ marginTop: 8 }}
        onClick=${() => { try { location.href = "/"; } catch (_) { location.assign("/"); } }}>Leave to website</button>
    </div>
  </div>` : null;
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
        { id: "courses", value: courses.length, label: "Modules on your track", icon: "book" },
        { id: "grades", value: grades.length, label: "Published results", icon: "chart" },
        { id: "score", value: avg != null ? avg : "—", label: avg != null ? "Average score" : "No scores yet", icon: "chart" },
        { id: "fees", value: "₦" + (paidTotal >= 1000 ? Math.round(paidTotal / 1000) + "k" : paidTotal), label: "Fees recorded", icon: "card" }
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
    setSection: navigateSection,
    stats: isDesktop ? deskStats : stats,
    courses,
    grades,
    payments,
    paidTotal,
    onLogout: logout,
    linked: !!(data && data.linked),
    announcements: (data && data.announcements) || [],
    promos: (data && data.promos) || [],
    slides: (data && data.slides) || [],
    slideSeconds: Math.max(3, Math.min(30, Number(data && data.portalSettings && data.portalSettings.slideSeconds) || 6)),
    assessments: (data && data.assessments) || [],
    certificates: (data && data.certificates) || [],
    attendance: (data && data.attendance) || [],
    schedule: (data && data.schedule) || [],
    messages: (data && data.messages) || [],
    notifications: (data && data.notifications) || [],
    user
  };

  // Desktop keeps the wide sidebar layout; deep lesson/test flows use the app view
  const deep = /^(course|lesson|test|lcheck|mquiz|fees:|receipt|grade:|notice:)/.test(String(section || ""));
  return html`
    ${isDesktop && !deep
      ? html`<${DesktopView} ctx=${ctx} />`
      : html`<div class=${isDesktop ? "desk-shell" : undefined}><${MobileView} ctx=${ctx} /></div>`}
    ${exitModal}
  `;
}

