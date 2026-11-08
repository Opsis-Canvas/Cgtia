/**
 * ExamTakePage: the examination link (/exam/take?token=...).
 * Feels like the portal: a short splash, one question per screen, a fixed layout that does not scroll,
 * a timer that shakes in the last minute, and a clear submit sheet. The server does the checking.
 */
import { createElement, useEffect, useRef, useState } from "react";
import htm from "htm";

const html = htm.bind(createElement);
const NAVY = "#0f126c";
const BLUE = "#0948e6";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#dfe6f3";
const RED = "#b91c1c";

const CSS = `
@keyframes exShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
@keyframes exPulse { 0%{transform:scale(.92);opacity:.6} 50%{transform:scale(1);opacity:1} 100%{transform:scale(.92);opacity:.6} }
@keyframes exRise { from{transform:translateY(24px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes exFade { from{opacity:0} to{opacity:1} }
@keyframes exSpin { to{transform:rotate(360deg)} }
@keyframes exRing { from{stroke-dashoffset:var(--ring-len)} to{stroke-dashoffset:var(--ring-off)} }
@keyframes exSheet { from{transform:translateY(100%)} to{transform:translateY(0)} }
.ex-shake{animation:exShake .6s ease-in-out infinite}
.ex-rise{animation:exRise .45s ease-out both}
.ex-fade{animation:exFade .35s ease-out both}
.ex-sheet{animation:exSheet .32s cubic-bezier(.2,.8,.2,1) both}
.ex-spin{animation:exSpin 1s linear infinite}
@media (prefers-reduced-motion: reduce){ .ex-shake,.ex-rise,.ex-fade,.ex-sheet,.ex-spin{animation:none} }
`;

async function post(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

function deviceId() {
  try {
    let id = localStorage.getItem("cgtia-exam-device");
    if (!id || id.length < 8) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : "d" + Date.now().toString(36) + Math.random().toString(36).slice(2, 12);
      localStorage.setItem("cgtia-exam-device", id);
    }
    return id;
  } catch (e) {
    return "d" + Math.random().toString(36).slice(2, 14);
  }
}

function clock(ms) {
  const t = Math.max(0, Math.floor(ms / 1000));
  return String(Math.floor(t / 60)).padStart(2, "0") + ":" + String(t % 60).padStart(2, "0");
}

function Ring({ pct, color }) {
  const r = 52, len = 2 * Math.PI * r, off = len * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return html`<svg width="130" height="130" viewBox="0 0 130 130" style=${{ display: "block", margin: "0 auto" }}>
    <circle cx="65" cy="65" r=${r} fill="none" stroke=${LINE} strokeWidth="10" />
    <circle cx="65" cy="65" r=${r} fill="none" stroke=${color} strokeWidth="10" strokeLinecap="round"
      strokeDasharray=${len} strokeDashoffset=${off} transform="rotate(-90 65 65)"
      style=${{ "--ring-len": len, "--ring-off": off, animation: "exRing 1s ease-out both" }} />
    <text x="65" y="72" textAnchor="middle" style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontWeight: 800, fontSize: "26px", fill: NAVY }}>${pct}%</text>
  </svg>`;
}

export function ExamTakePage() {
  const token = (new URLSearchParams(window.location.search).get("token") || "").trim();
  const dev = useRef(deviceId()).current;
  const [phase, setPhase] = useState("loading");   // loading | invalid | completed | started | intro | splash | running | sending | done
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [idx, setIdx] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [warn, setWarn] = useState("");
  const [sheet, setSheet] = useState(false);
  const [result, setResult] = useState(null);
  const [sendStep, setSendStep] = useState(0);
  const sessionRef = useRef(null); sessionRef.current = session;
  const answersRef = useRef({}); answersRef.current = answers;
  const submittedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/exam-link?token=" + encodeURIComponent(token) + "&device=" + encodeURIComponent(dev))
      .then(async (r) => {
        const text = await r.text();
        try { return JSON.parse(text); }
        catch (e) { throw new Error("HTTP " + r.status + " · the server did not return exam details."); }
      })
      .then((d) => {
        if (!alive) return;
        if (!d.valid) { setError(d.error || "This link is not valid."); setPhase("invalid"); return; }
        setExam(d);
        if (d.device && d.device.state === "completed") { setResult(d.device); setPhase("completed"); return; }
        if (d.device && d.device.state === "started") { setPhase("started"); return; }
        setPhase("intro");
      })
      .catch((e) => { if (alive) { setError("Could not check this link. " + (e && e.message ? e.message : "Try again later.")); setPhase("invalid"); } });
    return () => { alive = false; };
  }, []);

  // Lock the page while the exam runs: no scrolling, no pull-to-refresh
  useEffect(() => {
    const on = phase === "running" || phase === "sending" || phase === "splash";
    if (!on) return undefined;
    const prev = [document.body.style.overflow, document.documentElement.style.overscrollBehavior];
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    return () => { document.body.style.overflow = prev[0]; document.documentElement.style.overscrollBehavior = prev[1]; };
  }, [phase]);

  // Splash: two seconds of the brand, then the exam
  useEffect(() => {
    if (phase !== "splash") return undefined;
    const t = setTimeout(() => setPhase("running"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);

  const deadlineMs = session && session.deadline ? new Date(session.deadline).getTime() : 0;
  const left = deadlineMs ? deadlineMs - now : null;
  const danger = left !== null && left <= 60000 && left > 0;

  useEffect(() => {
    if (phase === "running" && left !== null && left <= 0 && exam && exam.settings.autoSubmit) submit("timer");
  }, [left, phase]);

  // Anti-cheat while the exam runs
  useEffect(() => {
    if (phase !== "running") return undefined;
    const block = (e) => { e.preventDefault(); setWarn("Copying and pasting are turned off for this exam."); };
    const onVis = async () => {
      if (!document.hidden || !sessionRef.current) return;
      setWarn("You left the exam screen. This is recorded.");
      const r = await post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: "tab" });
      if (r.ok && r.data.locked) submit("tab-limit");
    };
    const onFs = () => {
      if (!exam || !exam.settings.requireFullscreen || document.fullscreenElement || !sessionRef.current) return;
      setWarn("Please stay in full screen. This is recorded.");
      post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: "fullscreen" });
    };
    const kill = (e) => { if (e.key === "PrintScreen" || ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "a", "p", "s"].indexOf(e.key.toLowerCase()) >= 0)) { e.preventDefault(); } };
    const evs = [["copy", block], ["cut", block], ["paste", block], ["contextmenu", block], ["keydown", kill], ["visibilitychange", onVis], ["fullscreenchange", onFs]];
    evs.forEach(([n, f]) => document.addEventListener(n, f));
    return () => evs.forEach(([n, f]) => document.removeEventListener(n, f));
  }, [phase, exam]);

  async function begin(e) {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) { setError("Enter your full name to begin."); return; }
    if (exam.settings.requireFullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch (x) { /* the exam still runs */ }
    }
    setPhase("sending");
    setSendStep(0);
    const r = await post("/api/exam-start", { token, name: name.trim(), deviceId: dev });
    if (!r.ok || r.data.error) {
      if (r.data.device && r.data.device.state === "completed") { setResult(r.data.device); setPhase("completed"); return; }
      if (r.data.device && r.data.device.state === "started") { setPhase("started"); return; }
      setError(r.data.error || "Could not start the exam."); setPhase("intro"); return;
    }
    setSession({ sessionId: r.data.sessionId, deadline: r.data.deadline, questions: r.data.questions });
    setIdx(0); setAnswers({});
    setPhase("splash");
  }

  async function submit(reason) {
    if (submittedRef.current) return;
    const s = sessionRef.current;
    if (!s) return;
    submittedRef.current = true;
    setSheet(false);
    setPhase("sending");
    setSendStep(1);
    const stepTimer = setTimeout(() => setSendStep(2), 900);
    const r = await post("/api/exam-submit", { sessionId: s.sessionId, answers: answersRef.current, reason });
    clearTimeout(stepTimer);
    setSendStep(3);
    if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch (x) {} }
    if (!r.ok || r.data.error) {
      submittedRef.current = false;
      setError(r.data.error || "Could not send your answers. Your answers are still here, so try again.");
      setPhase("running");
      return;
    }
    setResult({ reason, ...r.data });
    setTimeout(() => setPhase("done"), 500);
  }

  // ---------- screens ----------
  const page = (children) => html`<div style=${{ minHeight: "100vh", background: "linear-gradient(180deg,#eef4ff 0%,#f8fafc 70%)", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
    <style>${CSS}</style>${children}
  </div>`;

  if (phase === "loading") return page(html`<div style=${{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
    <div class="ex-spin" style=${{ width: "36px", height: "36px", borderRadius: "50%", border: "3px solid " + LINE, borderTopColor: BLUE }}></div>
  </div>`);

  if (phase === "invalid") return page(html`<div class="ex-rise" style=${{ maxWidth: "560px", margin: "0 auto", padding: "56px 20px" }}>
    <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "26px", fontWeight: 800, color: NAVY, margin: "0 0 10px" }}>This exam can't be opened</h1>
    <p style=${{ color: MUTED, lineHeight: 1.6 }}>${error}</p>
  </div>`);

  if (phase === "completed" || phase === "started") {
    const completed = phase === "completed";
    return page(html`<div class="ex-rise" style=${{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
      <div style=${{ background: "#fff", border: "1px solid " + LINE, borderRadius: "28px", padding: "32px 24px", boxShadow: "0 24px 48px -30px rgba(15,18,108,.45)" }}>
        <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: BLUE, margin: "0 0 8px" }}>${exam ? exam.title : "Examination"}</p>
        <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "0 0 10px" }}>
          ${completed ? "You have already taken this exam" : "This exam was already started"}</h1>
        <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 18px" }}>
          ${completed ? "Thank you. Your answers have been received, and this device can't open the exam again." : "This device has already begun the exam. If you need help, contact the academy."}</p>
        ${completed && result && result.state === "completed" && result.resultMode === "instant"
          ? html`<div class="ex-fade" style=${{ marginTop: "8px" }}><${Ring} pct=${result.pct} color=${result.pct >= 50 ? BLUE : RED} />
              <p style=${{ color: MUTED, margin: "10px 0 0" }}>${result.score} of ${result.total} correct</p></div>` : null}
      </div>
    </div>`);
  }

  if (phase === "intro") {
    const s = exam.settings;
    const rules = [
      exam.timerMinutes ? ["Time", exam.timerMinutes + " minute" + (exam.timerMinutes === 1 ? "" : "s") + ". Your answers are sent when time runs out."] : null,
      s.oneAttempt ? ["One attempt", "You can take this exam once, on this device."] : null,
      s.requireFullscreen ? ["Full screen", "The exam runs in full screen. Stay in it until you finish."] : null,
      ["Leaving", "Leaving the exam screen is recorded" + (s.tabSwitchAllowed ? ". You may leave " + s.tabSwitchAllowed + " time(s) before it is sent for you." : ".")],
      ["Copying", "Copy, paste and right-click are turned off."],
      s.shuffle ? ["Order", "Questions may appear in a different order from others."] : null,
      ["Result", s.resultMode === "instant" ? "Your score shows as soon as you submit." : "The academy will be in touch with your result."]
    ].filter(Boolean);
    return page(html`<div class="ex-rise" style=${{ maxWidth: "560px", margin: "0 auto", padding: "28px 18px 120px" }}>
      <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: BLUE, margin: "0 0 8px" }}>Examination</p>
      <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "30px", fontWeight: 800, color: NAVY, margin: "0 0 10px", lineHeight: 1.15 }}>${exam.title}</h1>
      ${exam.description ? html`<p style=${{ color: INK, lineHeight: 1.6, margin: "0 0 22px", whiteSpace: "pre-line" }}>${exam.description}</p>` : html`<div style=${{ height: "14px" }}></div>`}
      <div style=${{ background: "#fff", border: "1px solid " + LINE, borderRadius: "24px", overflow: "hidden", marginBottom: "18px" }}>
        ${rules.map(([k, v], i) => html`<div key=${k} class="ex-rise" style=${{ display: "grid", gridTemplateColumns: "96px 1fr", gap: "12px", padding: "14px 18px", borderTop: i ? "1px solid " + LINE : "none", animationDelay: (i * 60) + "ms" }}>
          <span style=${{ fontSize: "12px", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: NAVY, paddingTop: "2px" }}>${k}</span>
          <span style=${{ fontSize: "14px", lineHeight: 1.5, color: INK }}>${v}</span>
        </div>`)}
      </div>
      <form onSubmit=${begin}>
        <label style=${{ display: "block", fontSize: "12px", fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, margin: "0 0 8px" }}>Your full name</label>
        <input value=${name} onInput=${(e) => setName(e.target.value)} placeholder="As you want it recorded" style=${{ width: "100%", border: "1px solid " + LINE, borderRadius: "18px", padding: "15px 16px", font: "inherit", fontSize: "16px", boxSizing: "border-box", background: "#fff" }} />
        ${error ? html`<p class="ex-fade" style=${{ color: RED, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "10px 12px", margin: "12px 0 0", fontSize: "14px" }}>${error}</p>` : null}
        <div style=${{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 18px calc(14px + env(safe-area-inset-bottom, 0px))", background: "rgba(248,250,252,.92)", backdropFilter: "blur(8px)", borderTop: "1px solid " + LINE }}>
          <div style=${{ maxWidth: "560px", margin: "0 auto" }}>
            <button type="submit" style=${{ width: "100%", height: "54px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", letterSpacing: ".02em", cursor: "pointer", boxShadow: "0 14px 26px -14px rgba(15,18,108,.7)" }}>Begin the exam</button>
          </div>
        </div>
      </form>
    </div>`);
  }

  if (phase === "splash") return page(html`<div class="ex-fade" style=${{ minHeight: "100vh", display: "grid", placeItems: "center", background: "linear-gradient(160deg,#0f126c 0%,#0948e6 100%)" }}>
    <div style=${{ textAlign: "center", color: "#fff" }}>
      <div class="ex-rise" style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "34px", fontWeight: 900, letterSpacing: ".04em" }}>CGTIA</div>
      <div style=${{ marginTop: "10px", fontSize: "13px", opacity: .8, letterSpacing: ".12em", textTransform: "uppercase" }}>Preparing your exam</div>
      <div class="ex-spin" style=${{ width: "28px", height: "28px", margin: "22px auto 0", borderRadius: "50%", border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff" }}></div>
    </div>
  </div>`);

  if (phase === "sending") {
    const steps = ["Checking your answers", "Saving your exam", "Almost done"];
    return page(html`<div class="ex-fade" style=${{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "24px" }}>
      <div style=${{ textAlign: "center", maxWidth: "340px" }}>
        <svg width="72" height="72" viewBox="0 0 72 72" class="ex-spin" style=${{ display: "block", margin: "0 auto" }}>
          <circle cx="36" cy="36" r="30" fill="none" stroke=${LINE} strokeWidth="6" />
          <path d="M36 6 A30 30 0 0 1 66 36" fill="none" stroke=${BLUE} strokeWidth="6" strokeLinecap="round" />
        </svg>
        <h2 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "20px", fontWeight: 800, color: NAVY, margin: "22px 0 14px" }}>${sendStep >= 3 ? "Submitted" : "Sending your answers"}</h2>
        <div style=${{ display: "grid", gap: "8px", textAlign: "left" }}>
          ${steps.map((t, i) => html`<div key=${t} class="ex-rise" style=${{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: sendStep > i ? INK : MUTED, animationDelay: (i * 120) + "ms" }}>
            <span style=${{ width: "20px", height: "20px", borderRadius: "50%", display: "inline-grid", placeItems: "center", fontSize: "12px", color: "#fff", background: sendStep > i ? "#16a34a" : LINE }}>${sendStep > i ? "✓" : ""}</span>
            ${t}
          </div>`)}
        </div>
      </div>
    </div>`);
  }

  if (phase === "done") {
    const instant = result && result.pct != null;
    return page(html`<div class="ex-rise" style=${{ maxWidth: "560px", margin: "0 auto", padding: "48px 20px", textAlign: "center" }}>
      <div style=${{ background: "#fff", border: "1px solid " + LINE, borderRadius: "28px", padding: "34px 24px", boxShadow: "0 24px 48px -30px rgba(15,18,108,.45)" }}>
        <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: BLUE, margin: "0 0 8px" }}>${exam.title}</p>
        <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "0 0 14px" }}>${instant ? "Your result" : "Thank you"}</h1>
        ${instant
          ? html`<div class="ex-fade"><${Ring} pct=${result.pct} color=${result.pct >= 50 ? BLUE : RED} />
              <p style=${{ color: MUTED, margin: "10px 0 0" }}>${result.score} of ${result.total} correct</p></div>`
          : html`<p style=${{ color: MUTED, lineHeight: 1.6, margin: 0 }}>Your answers have been received. The academy will be in touch with your result.</p>`}
        <p style=${{ color: MUTED, fontSize: "13px", marginTop: "18px" }}>You can close this page now.</p>
      </div>
    </div>`);
  }

  // ---------- running: one question per screen, no scrolling ----------
  const qs = session.questions || [];
  const q = qs[idx];
  const answered = Object.keys(answers).length;
  const last = idx === qs.length - 1;
  const pick = (oi) => setAnswers({ ...answers, [q.i]: oi });

  return page(html`<div style=${{ height: "100vh", height: "100dvh", display: "flex", flexDirection: "column", overflow: "hidden", padding: "calc(12px + env(safe-area-inset-top, 0px)) 16px calc(14px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box", maxWidth: "640px", margin: "0 auto" }}>
    <style>${CSS}</style>
    <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
      <strong style=${{ fontFamily: "Montserrat, Inter, sans-serif", color: NAVY, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${exam.title}</strong>
      <span class=${danger ? "ex-shake" : ""} style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontWeight: 800, fontSize: "18px", fontVariantNumeric: "tabular-nums", color: danger ? RED : NAVY, padding: "6px 12px", borderRadius: "999px", background: danger ? "#fef2f2" : "#fff", border: "1px solid " + (danger ? "#fecaca" : LINE), transition: "color .3s, background .3s" }}>${left !== null ? clock(left) : "—"}</span>
    </div>
    <div style=${{ height: "6px", background: LINE, borderRadius: "999px", overflow: "hidden", margin: "12px 0 0" }}>
      <div style=${{ height: "100%", width: ((answered / Math.max(1, qs.length)) * 100) + "%", background: "linear-gradient(90deg," + BLUE + "," + NAVY + ")", borderRadius: "999px", transition: "width .4s ease" }}></div>
    </div>
    ${warn ? html`<p class="ex-fade" role="alert" style=${{ color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "9px 12px", margin: "10px 0 0", fontSize: "13px" }}>${warn}</p>` : null}
    <div key=${idx} class="ex-rise" style=${{ flex: "1 1 auto", minHeight: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "10px 0" }}>
      <p style=${{ fontSize: "12px", color: MUTED, fontWeight: 800, letterSpacing: ".06em", textTransform: "uppercase", margin: "0 0 8px" }}>Question ${idx + 1} of ${qs.length}</p>
      <h2 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "21px", fontWeight: 800, color: INK, margin: "0 0 16px", lineHeight: 1.3, userSelect: "none", WebkitUserSelect: "none" }}>${q ? q.prompt : ""}</h2>
      <div style=${{ display: "grid", gap: "10px" }}>
        ${q ? q.options.map((o, oi) => {
          const on = answers[q.i] === oi;
          return html`<button key=${oi} type="button" onClick=${() => pick(oi)} style=${{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left", width: "100%", padding: "15px 16px", borderRadius: "18px", border: "1.5px solid " + (on ? BLUE : LINE), background: on ? "#eef4ff" : "#fff", color: INK, font: "inherit", fontSize: "16px", cursor: "pointer", transition: "border-color .2s, background .2s, transform .15s", transform: on ? "scale(1.01)" : "scale(1)" }}>
            <span style=${{ width: "22px", height: "22px", borderRadius: "50%", border: "2px solid " + (on ? BLUE : "#94a3b8"), display: "grid", placeItems: "center", flex: "0 0 auto" }}>${on ? html`<span style=${{ width: "10px", height: "10px", borderRadius: "50%", background: BLUE }}></span>` : null}</span>
            <span>${o}</span>
          </button>`;
        }) : null}
      </div>
    </div>
    ${error ? html`<p style=${{ color: RED, fontSize: "13px", margin: "0 0 8px" }}>${error}</p>` : null}
    <div style=${{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px", alignItems: "center" }}>
      <button type="button" disabled=${idx === 0} onClick=${() => setIdx(idx - 1)} style=${{ height: "52px", padding: "0 20px", borderRadius: "999px", border: "1px solid " + LINE, background: "#fff", color: NAVY, fontWeight: 800, opacity: idx === 0 ? .4 : 1, cursor: "pointer" }}>Back</button>
      ${last
        ? html`<button type="button" onClick=${() => setSheet(true)} style=${{ height: "52px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 14px 26px -14px rgba(15,18,108,.7)" }}>Submit exam</button>`
        : html`<button type="button" onClick=${() => setIdx(idx + 1)} style=${{ height: "52px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer", boxShadow: "0 14px 26px -14px rgba(15,18,108,.7)" }}>Next</button>`}
    </div>
    ${sheet ? html`<div class="ex-fade" role="dialog" aria-modal="true" aria-label="Submit your exam" onClick=${() => setSheet(false)} style=${{ position: "fixed", inset: 0, background: "rgba(8,12,40,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div class="ex-sheet" onClick=${(e) => e.stopPropagation()} style=${{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "28px 28px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
        <div style=${{ width: "44px", height: "5px", borderRadius: "999px", background: LINE, margin: "0 auto 16px" }}></div>
        <h3 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "20px", fontWeight: 800, color: NAVY, margin: "0 0 6px" }}>Submit your exam?</h3>
        <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 14px" }}>You have answered <strong style=${{ color: INK }}>${answered} of ${qs.length}</strong> questions. You cannot change your answers after you submit.</p>
        ${answered < qs.length ? html`<p style=${{ color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "10px 12px", fontSize: "13px", margin: "0 0 14px" }}>${qs.length - answered} question(s) are still unanswered.</p>` : null}
        <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button type="button" onClick=${() => setSheet(false)} style=${{ height: "52px", borderRadius: "999px", border: "1px solid " + LINE, background: "#fff", color: NAVY, fontWeight: 800, cursor: "pointer" }}>Keep going</button>
          <button type="button" onClick=${() => submit("manual")} style=${{ height: "52px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Submit</button>
        </div>
      </div>
    </div>` : null}
  </div>`);
}
