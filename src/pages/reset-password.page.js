/**
 * /reset : the page students reach from the password reset email.
 * Checks the link, then lets the student set a new password.
 */
import { createElement, useEffect, useState } from "react";
import htm from "htm";

const html = htm.bind(createElement);
const NAVY = "#0f126c";
const BLUE = "#0948e6";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#dfe6f3";
const RED = "#b91c1c";

async function auth() {
  const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const mod = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js");
  const cfg = {
    apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
    authDomain: "verify-cgtia-cert.firebaseapp.com",
    projectId: "verify-cgtia-cert",
    storageBucket: "verify-cgtia-cert.firebasestorage.app",
    messagingSenderId: "766655761701",
    appId: "1:766655761701:web:d59853909358bf3b9b5ecc"
  };
  const app = getApps().length ? getApp() : initializeApp(cfg);
  return { ...mod, auth: mod.getAuth(app) };
}

export function ResetPasswordPage() {
  const [code, setCode] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState("checking"); // checking | ready | done | bad
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [lib, setLib] = useState(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const oob = p.get("oobCode") || "";
    const mode = p.get("mode") || "";
    if (!oob || (mode && mode !== "resetPassword")) { setState("bad"); return; }
    setCode(oob);
    (async () => {
      try {
        const a = await auth();
        setLib(a);
        const who = await a.verifyPasswordResetCode(a.auth, oob);
        setEmail(who);
        setState("ready");
      } catch (e) {
        setState("bad");
      }
    })();
  }, []);

  async function save(e) {
    e.preventDefault();
    setErr("");
    if (pw.length < 6) { setErr("Use at least 6 characters."); return; }
    if (pw !== pw2) { setErr("The two passwords do not match."); return; }
    setBusy(true);
    try {
      await lib.confirmPasswordReset(lib.auth, code, pw);
      setState("done");
    } catch (e) {
      setErr("This link has expired or was already used. Request a new one from the student portal.");
    }
    setBusy(false);
  }

  const card = (children) => html`<div style=${{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#eef3fb", padding: "16px", fontFamily: "Inter, system-ui, sans-serif" }}>
    <div style=${{ width: "100%", maxWidth: "420px", background: "#fff", borderRadius: "24px", padding: "26px 22px", boxShadow: "0 24px 48px -30px rgba(15,18,108,.35)" }}>
      <p style=${{ margin: 0, fontWeight: 800, color: NAVY, letterSpacing: ".04em" }}>CGTIA</p>
      ${children}
    </div>
  </div>`;

  const label = { display: "block", fontSize: "12px", fontWeight: 700, color: "#475569", margin: "14px 0 6px" };
  const input = { width: "100%", height: "46px", border: "1px solid " + LINE, borderRadius: "14px", padding: "0 14px", background: "#f8fafc", font: "inherit", color: INK, boxSizing: "border-box" };
  const btn = { width: "100%", height: "48px", marginTop: "18px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, fontSize: "15px", cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1 };

  if (state === "checking") return card(html`<h1 style=${{ fontSize: "22px", color: NAVY, margin: "14px 0 6px" }}>Checking your link…</h1>`);
  if (state === "bad") return card(html`
    <h1 style=${{ fontSize: "22px", color: NAVY, margin: "14px 0 6px" }}>This link is not valid</h1>
    <p style=${{ color: MUTED, lineHeight: 1.5 }}>It may have expired or already been used. Go back to the student portal and tap Forgot password to get a new link.</p>
    <a href="/dashboard" style=${{ display: "block", textAlign: "center", marginTop: "18px", height: "48px", lineHeight: "48px", borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, textDecoration: "none" }}>Go to the student portal</a>`);
  if (state === "done") return card(html`
    <h1 style=${{ fontSize: "22px", color: NAVY, margin: "14px 0 6px" }}>Password changed</h1>
    <p style=${{ color: MUTED, lineHeight: 1.5 }}>You can now sign in with your new password.</p>
    <a href="/dashboard" style=${{ display: "block", textAlign: "center", marginTop: "18px", height: "48px", lineHeight: "48px", borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, textDecoration: "none" }}>Sign in</a>`);
  return card(html`
    <h1 style=${{ fontSize: "22px", color: NAVY, margin: "14px 0 6px" }}>Set a new password</h1>
    <p style=${{ color: MUTED, margin: 0, lineHeight: 1.5 }}>For ${email}</p>
    <form onSubmit=${save}>
      <label style=${label}>NEW PASSWORD</label>
      <input style=${input} type="password" autoComplete="new-password" value=${pw} onInput=${(e) => setPw(e.target.value)} />
      <label style=${label}>CONFIRM NEW PASSWORD</label>
      <input style=${input} type="password" autoComplete="new-password" value=${pw2} onInput=${(e) => setPw2(e.target.value)} />
      ${err ? html`<p style=${{ color: RED, fontSize: "14px", margin: "12px 0 0" }}>${err}</p>` : null}
      <button type="submit" style=${btn} disabled=${busy}>${busy ? "Saving…" : "Save new password"}</button>
    </form>`);
}
