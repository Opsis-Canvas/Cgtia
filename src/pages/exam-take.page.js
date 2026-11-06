/**
 * ExamTakePage: the examination link (/exam/take?token=...).
 * Greeting and rules, then one question at a time, with a timer and the anti-cheat rules the exam sets.
 * The page shows and sends. The server checks the link, sets the deadline, counts tab switches and marks the attempt.
 */
import { createElement, useEffect, useRef, useState } from "react";
import htm from "htm";

const html = htm.bind(createElement);
const NAVY = "#0f126c";
const BLUE = "#0948e6";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#dfe6f3";

const card = { maxWidth: "720px", margin: "0 auto", background: "#fff", border: "1px solid " + LINE, borderRadius: "28px", padding: "28px", boxShadow: "0 24px 48px -30px rgba(15,18,108,.45)" };
const shell = { minHeight: "100vh", background: "linear-gradient(180deg,#eef4ff 0%,#f8fafc 60%)", padding: "24px 16px 64px", fontFamily: "Inter, system-ui, sans-serif", color: INK, boxSizing: "border-box" };
const head = { fontFamily: "Montserrat, Inter, system-ui, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "0 0 8px", lineHeight: 1.2 };
const btn = { height: "48px", padding: "0 20px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 700, fontSize: "15px", cursor: "pointer", width: "auto" };
const btnGhost = { height: "44px", padding: "0 18px", border: "1px solid " + LINE, borderRadius: "999px", background: "#fff", color: NAVY, fontWeight: 700, fontSize: "15px", cursor: "pointer", width: "auto" };
const pill = (on) => ({ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid " + (on ? BLUE : LINE), background: on ? "#eef4ff" : "#f8fafc", borderRadius: "999px", padding: "12px 16px", fontSize: "15px", cursor: "pointer", width: "100%", boxSizing: "border-box" });

function clock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}

async function post(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function ExamTakePage() {
  const token = (new URLSearchParams(window.location.search).get("token") || "").trim();
  const [phase, setPhase] = useState("loading"); // loading | invalid | intro | running | sending | done
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [warn, setWarn] = useState("");
  const [tabs, setTabs] = useState(0);
  const [result, setResult] = useState(null);
  const sessionRef = useRef(null);
  sessionRef.current = session;
  const answersRef = useRef({});
  answersRef.current = answers;

  useEffect(() => {
    let alive = true;
    fetch("/api/exam-link?token=" + encodeURIComponent(token))
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (!d.valid) { setError(d.error || "This link is not valid."); setPhase("invalid"); return; }
        setExam(d);
        setName(d.email ? "" : "");
        setPhase("intro");
      })
      .catch(() => { if (alive) { setError("Could not check this link. Try again later."); setPhase("invalid"); } });
    return () => { alive = false; };
  }, []);

  // The clock runs from the server's deadline, so a refresh does not reset it
  useEffect(() => {
    if (phase !== "running") return undefined;
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, [phase]);

  const deadlineMs = session && session.deadline ? new Date(session.deadline).getTime() : 0;
  const left = deadlineMs ? deadlineMs - now : null;

  // Time is up: send what is there, unless the exam has auto-submit off
  useEffect(() => {
    if (phase === "running" && left !== null && left <= 0 && exam && exam.settings.autoSubmit) submit("timer");
  }, [left, phase]);

  // Anti-cheat while the exam runs
  useEffect(() => {
    if (phase !== "running") return undefined;
    const block = (e) => { e.preventDefault(); setWarn("Copying and pasting are turned off for this exam."); };
    const onVis = async () => {
      if (!document.hidden || !sessionRef.current) return;
      setTabs((n) => n + 1);
      setWarn("You left the exam screen. This is recorded.");
      const r = await post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: "tab" });
      if (r.ok && r.data.locked) submit("tab-limit");
      else if (r.ok) setTabs(r.data.tabSwitches || 0);
    };
    const onFs = async () => {
      if (!exam || !exam.settings.requireFullscreen || document.fullscreenElement || !sessionRef.current) return;
      setWarn("Please return to full screen to continue. This is recorded.");
      post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: "fullscreen" });
    };
    const kill = (e) => { if (e.key === "PrintScreen" || ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "a", "p", "s"].indexOf(e.key.toLowerCase()) >= 0)) { e.preventDefault(); setWarn("That key is turned off for this exam."); } };
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("paste", block);
    document.addEventListener("contextmenu", block);
    document.addEventListener("keydown", kill);
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("paste", block);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("keydown", kill);
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [phase, exam]);

  async function begin(e) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) { setError("Enter your full name to begin."); return; }
    if (exam.settings.requireFullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch (x) { /* the person may refuse; the exam still runs */ }
    }
    setPhase("sending");
    const r = await post("/api/exam-start", { token, name: name.trim() });
    if (!r.ok || r.data.error) { setError(r.data.error || "Could not start the exam."); setPhase("intro"); return; }
    setSession({ sessionId: r.data.sessionId, deadline: r.data.deadline, questions: r.data.questions });
    setPhase("running");
  }

  async function submit(reason) {
    if (phase === "sending" || phase === "done") return;
    const s = sessionRef.current;
    if (!s) return;
    setPhase("sending");
    const r = await post("/api/exam-submit", { sessionId: s.sessionId, answers: answersRef.current, reason });
    if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch (x) {} }
    if (!r.ok || r.data.error) { setError(r.data.error || "Could not send your answers. Try again."); setPhase("running"); return; }
    setResult({ reason, ...r.data });
    setPhase("done");
  }

  const wrap = (children) => html`<div style=${shell}><div style=${card}>${children}</div></div>`;

  if (phase === "loading") return wrap(html`<p style=${{ color: MUTED }}>Loading…</p>`);
  if (phase === "invalid") return wrap(html`<h1 style=${head}>This exam can't be opened</h1><p style=${{ color: MUTED, lineHeight: 1.6 }}>${error}</p>`);

  if (phase === "intro") {
    const s = exam.settings;
    return wrap(html`
      <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: BLUE, margin: "0 0 6px" }}>Examination</p>
      <h1 style=${head}>${exam.title}</h1>
      ${exam.description ? html`<p style=${{ color: INK, lineHeight: 1.6, whiteSpace: "pre-line" }}>${exam.description}</p>` : null}
      <div style=${{ background: "#f8fafc", border: "1px solid " + LINE, borderRadius: "18px", padding: "16px 18px", margin: "18px 0" }}>
        <p style=${{ fontWeight: 800, margin: "0 0 8px" }}>Before you begin</p>
        <ul style=${{ margin: 0, paddingLeft: "18px", color: INK, lineHeight: 1.7, fontSize: "14px" }}>
          ${exam.timerMinutes ? html`<li>You have ${exam.timerMinutes} minute${exam.timerMinutes === 1 ? "" : "s"}. The exam is submitted when time runs out.</li>` : null}
          ${s.oneAttempt ? html`<li>You can take this exam once.</li>` : null}
          ${s.requireFullscreen ? html`<li>The exam opens in full screen. Stay in full screen until you finish.</li>` : null}
          <li>Leaving the exam screen is recorded${s.tabSwitchAllowed ? ". You may leave it " + s.tabSwitchAllowed + " time(s) before the exam is submitted for you" : ""}.</li>
          <li>Copying, pasting and right-click are turned off.</li>
          ${s.shuffle ? html`<li>The questions may appear in a different order from others.</li>` : null}
          <li>${s.resultMode === "instant" ? "Your score is shown as soon as you submit." : "The academy will be in touch with your result."}</li>
        </ul>
      </div>
      <form onSubmit=${begin}>
        <label style=${{ display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, margin: "0 0 7px" }}>Your full name</label>
        <input value=${name} onInput=${(e) => setName(e.target.value)} style=${{ width: "100%", border: "1px solid " + LINE, borderRadius: "16px", padding: "13px 15px", font: "inherit", fontSize: "15px", boxSizing: "border-box", background: "#f8fafc" }} />
        ${error ? html`<p style=${{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "10px 12px", margin: "14px 0 0", fontSize: "14px" }}>${error}</p>` : null}
        <button type="submit" style=${Object.assign({}, btn, { marginTop: "18px", width: "100%" })}>Begin the exam</button>
      </form>`);
  }

  if (phase === "done") {
    return wrap(html`
      <h1 style=${head}>${result && result.pct != null ? "Your result" : "Thank you"}</h1>
      ${result && result.pct != null
        ? html`<p style=${{ fontSize: "40px", fontWeight: 800, color: NAVY, margin: "8px 0" }}>${result.pct}%</p><p style=${{ color: MUTED }}>${result.score} of ${result.total} correct.</p>`
        : html`<p style=${{ color: MUTED, lineHeight: 1.6 }}>Your answers have been received. The academy will be in touch with your result.</p>`}
    `);
  }

  if (phase === "sending") return wrap(html`<p style=${{ color: MUTED }}>Sending your answers…</p>`);

  // running
  const qs = session.questions || [];
  const q = qs[idx];
  const answered = Object.keys(answers).length;
  return html`<div style=${shell}>
    <div style=${{ maxWidth: "720px", margin: "0 auto" }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "14px", flexWrap: "wrap" }}>
        <strong style=${{ color: NAVY }}>${exam.title}</strong>
        <span style=${{ fontWeight: 800, fontVariantNumeric: "tabular-nums", color: left !== null && left < 60000 ? "#b91c1c" : NAVY }}>${left !== null ? clock(left) : ""}</span>
      </div>
      ${warn ? html`<p role="alert" style=${{ color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "10px 12px", margin: "0 0 14px", fontSize: "14px" }}>${warn}</p>` : null}
      <div style=${card}>
        <p style=${{ fontSize: "12px", color: MUTED, fontWeight: 700, margin: "0 0 6px" }}>Question ${idx + 1} of ${qs.length} · ${answered} answered</p>
        ${q ? html`<h2 style=${{ fontSize: "19px", fontWeight: 700, color: INK, margin: "0 0 16px", lineHeight: 1.4, userSelect: "none", WebkitUserSelect: "none" }}>${q.prompt}</h2>
          <div style=${{ display: "grid", gap: "10px", gridTemplateColumns: "1fr" }}>
            ${q.options.map((o, oi) => html`<label key=${oi} style=${pill(answers[q.i] === oi)}>
              <input type="radio" name=${"q" + q.i} checked=${answers[q.i] === oi} onChange=${() => setAnswers({ ...answers, [q.i]: oi })} style=${{ accentColor: BLUE }} />
              <span>${o}</span>
            </label>`)}
          </div>` : null}
        <div style=${{ display: "flex", justifyContent: "space-between", gap: "10px", marginTop: "24px", flexWrap: "wrap" }}>
          <button type="button" disabled=${idx === 0} onClick=${() => setIdx(idx - 1)} style=${Object.assign({}, btnGhost, { opacity: idx === 0 ? 0.5 : 1 })}>Back</button>
          ${idx < qs.length - 1
            ? html`<button type="button" onClick=${() => setIdx(idx + 1)} style=${btn}>Next</button>`
            : html`<button type="button" onClick=${() => { if (confirm("Submit your exam now? You cannot change your answers after this.")) submit("manual"); }} style=${btn}>Submit exam</button>`}
        </div>
      </div>
      ${error ? html`<p style=${{ color: "#b91c1c", marginTop: "12px" }}>${error}</p>` : null}
    </div>
  </div>`;
}
