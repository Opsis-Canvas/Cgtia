/**
 * ExamTakePage: the examination link (/exam/take?token=...).
 * Looks like the portal: a splash, a fixed screen (nothing scrolls), one question at a time,
 * a timer pinned at the top that shakes in the last minute, and a submit that waits until the admin has the answers.
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
const GREEN = "#15803d";

const CSS = `
@keyframes exShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-5px)} 40%{transform:translateX(5px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)} }
@keyframes exPulse { 0%,100%{transform:scale(.94);opacity:.7} 50%{transform:scale(1);opacity:1} }
@keyframes exRise { from{transform:translateY(14px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes exFade { from{opacity:0} to{opacity:1} }
@keyframes exSpin { to{transform:rotate(360deg)} }
@keyframes exDraw { from{stroke-dashoffset:60} to{stroke-dashoffset:0} }
@keyframes exRing { from{stroke-dashoffset:var(--ring-len)} to{stroke-dashoffset:var(--ring-off)} }
.ex-shake{animation:exShake .6s ease-in-out infinite}
.ex-pulse{animation:exPulse 1.6s ease-in-out infinite}
.ex-rise{animation:exRise .4s ease-out both}
.ex-fade{animation:exFade .3s ease-out both}
.ex-spin{animation:exSpin .9s linear infinite}
.ex-draw{stroke-dasharray:60;animation:exDraw .6s ease-out .15s both}
@media (prefers-reduced-motion: reduce){ .ex-shake,.ex-pulse,.ex-rise,.ex-fade,.ex-spin,.ex-draw{animation:none} }
@media print { html, body { display: none !important; } }
.ex-cover{position:fixed;inset:0;z-index:999;background:#0b1020;color:#fff;display:flex;align-items:center;justify-content:center;padding:28px;text-align:center}
.ex-cam{position:absolute;top:calc(74px + env(safe-area-inset-top,0px));left:50%;transform:translateX(-50%);width:128px;height:96px;border-radius:18px;overflow:hidden;border:2px solid #fff;box-shadow:0 14px 26px -14px rgba(8,12,40,.7);background:#0b1020;z-index:3}
.ex-cam video{width:100%;height:100%;object-fit:cover;transform:scaleX(-1)}
.ex-meter{height:6px;border-radius:999px;background:#dfe6f3;overflow:hidden}
.ex-meter>span{display:block;height:100%;background:linear-gradient(90deg,#0948e6,#15803d);transition:width .12s linear}
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

// Full-screen shell. Fixed to the viewport so nothing can scroll behind it.
function Screen({ children, bg }) {
  return html`<div style=${{ position: "fixed", inset: 0, overflow: "hidden", display: "flex", flexDirection: "column", background: bg || "linear-gradient(180deg,#eef4ff 0%,#f8fafc 65%)", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
    <style>${CSS}</style>${children}
  </div>`;
}

function Mark({ size = 84, tone = BLUE, label }) {
  return html`<div style=${{ width: size + "px", height: size + "px", borderRadius: "50%", background: tone, display: "grid", placeItems: "center", boxShadow: "0 18px 34px -18px " + tone, margin: "0 auto" }}>
    ${label ? label : html`<svg width=${size * 0.44} height=${size * 0.44} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path class="ex-draw" d="M5 12.5l4.2 4.2L19 7"/></svg>`}
  </div>`;
}

function Ring({ pct, color }) {
  const r = 58, len = 2 * Math.PI * r, off = len * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return html`<svg width="150" height="150" viewBox="0 0 150 150" style=${{ display: "block", margin: "0 auto" }}>
    <circle cx="75" cy="75" r=${r} fill="none" stroke=${LINE} strokeWidth="11" />
    <circle cx="75" cy="75" r=${r} fill="none" stroke=${color} strokeWidth="11" strokeLinecap="round"
      strokeDasharray=${len} strokeDashoffset=${off} transform="rotate(-90 75 75)"
      style=${{ "--ring-len": len, "--ring-off": off, animation: "exRing 1.1s ease-out both" }} />
    <text x="75" y="82" textAnchor="middle" style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontWeight: 800, fontSize: "30px", fill: NAVY }}>${pct}%</text>
  </svg>`;
}

export function ExamTakePage() {
  const token = (new URLSearchParams(window.location.search).get("token") || "").trim();
  const dev = useRef(deviceId()).current;
  const [phase, setPhase] = useState("loading");
  const [consent, setConsent] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [bright, setBright] = useState(0);
  const BRIGHT_MIN = 30;
  const brightRef = useRef(0);
  const faceOkRef = useRef(false);
  const lastSpeak = useRef(0);
  const badMs = useRef(0);
  function speak(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech is optional */ }
  }
  const detRef = useRef(null);
  const [faceOk, setFaceOk] = useState(false);
  const [faceMsg, setFaceMsg] = useState("Looking for your face…");
  useEffect(() => { faceOkRef.current = faceOk; }, [faceOk]);
  const VISION = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
  const FACE_MODEL = "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite";
  // Face check: exactly one face, large enough, confident, and all six key points (eyes, ears, nose, mouth) inside the frame
  function judgeFaces(res, v) {
    const list = (res && res.detections) || [];
    if (list.length === 0) { setFaceOk(false); setFaceMsg("No face found. Look straight at the camera."); return; }
    if (list.length > 1) { setFaceOk(false); setFaceMsg("More than one face. Only you should be in the frame."); return; }
    const d = list[0];
    const bb = d.boundingBox || {};
    const big = bb.width / Math.max(1, v.videoWidth) >= 0.2;
    const inside = (d.keypoints || []).every((k) => k.x >= 0 && k.x <= 1 && k.y >= 0 && k.y <= 1);
    const sure = ((d.categories && d.categories[0] && d.categories[0].score) || 0) >= 0.6;
    if (!big) { setFaceOk(false); setFaceMsg("Move closer so your face fills more of the square."); return; }
    if (!inside || !sure) { setFaceOk(false); setFaceMsg("Your face is not fully visible. Keep your eyes, nose and mouth in the square."); return; }
    setFaceOk(true); setFaceMsg("Face clear.");
  }
  const [camState, setCamState] = useState("idle"); // idle | asking | on | denied
  const [level, setLevel] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [photo, setPhoto] = useState("");
  const streamRef = useRef(null);
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const lastCap = useRef(0); // loading | invalid | completed | started | intro | preparing | splash | running | sending | done
  const [exam, setExam] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [regNo, setRegNo] = useState("");
  const [info, setInfo] = useState({ restricted: false, needsEmail: false, needsReg: false, needsName: true });
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
  const pollRef = useRef(null);

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
        setInfo({ restricted: !!d.restricted, needsEmail: !!d.needsEmail, needsReg: !!d.needsReg, needsName: d.needsName !== false });
        if (d.device && d.device.state === "completed") { setResult(d.device); setPhase("completed"); return; }
        if (d.device && d.device.state === "started") { setPhase("started"); return; }
        setPhase("intro");
      })
      .catch((e) => { if (alive) { setError("Could not check this link. " + (e && e.message ? e.message : "Try again later.")); setPhase("invalid"); } });
    return () => { alive = false; if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  // Splash: two seconds of the brand, then the exam
  useEffect(() => {
    if (phase !== "splash") return undefined;
    const t = setTimeout(() => setPhase("running"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  // Brightness of the live picture, 0-100. Measured on a tiny copy of each frame, so it is cheap.
  // Loads the free face model once. If it cannot load, the exam still runs and staff check the photo by hand.
  useEffect(() => {
    if (camState !== "on" || detRef.current) return;
    (async () => {
      try {
        const m = await import(VISION + "/vision_bundle.mjs");
        const fs = await m.FilesetResolver.forVisionTasks(VISION + "/wasm");
        detRef.current = await m.FaceDetector.createFromOptions(fs, { baseOptions: { modelAssetPath: FACE_MODEL, delegate: "CPU" }, runningMode: "VIDEO", minDetectionConfidence: 0.6 });
      } catch (e) {
        setFaceOk(true);
        setFaceMsg("Face check unavailable here. Staff will check your photo by hand.");
      }
    })();
  }, [camState]);

  useEffect(() => {
    if (camState !== "on") return undefined;
    const c = document.createElement("canvas"); c.width = 48; c.height = 36;
    const g = c.getContext("2d", { willReadFrequently: true });
    const t = setInterval(() => {
      const v = videoRef.current;
      if (!v || !v.videoWidth) return;
      g.drawImage(v, 0, 0, 48, 36);
      const d = g.getImageData(0, 0, 48, 36).data;
      let sum = 0;
      for (let i = 0; i < d.length; i += 4) sum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
      const b = Math.round((sum / (d.length / 4)) / 255 * 100);
      brightRef.current = b;
      setBright(b);
      if (detRef.current && v.readyState >= 2) { try { judgeFaces(detRef.current.detectForVideo(v, performance.now()), v); } catch (e) {} }
    }, 400);
    return () => clearInterval(t);
  }, [camState]);

  useEffect(() => {
    if (camState !== "on") return undefined;
    const t = setInterval(() => {
      const ok = brightRef.current >= BRIGHT_MIN && faceOkRef.current;
      badMs.current = ok ? 0 : badMs.current + 1000;
      if (badMs.current >= 3000 && Date.now() - lastSpeak.current > 12000) {
        lastSpeak.current = Date.now();
        speak(brightRef.current < BRIGHT_MIN ? "Move into a brighter area, and face the light." : "Keep your whole face inside the frame.");
      }
    }, 1000);
    return () => clearInterval(t);
  }, [camState]);

  useEffect(() => {
    if (phase !== "running") return undefined;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [phase]);

  // Lock the page while the exam is on screen
  useEffect(() => {
    const on = ["preparing", "splash", "running", "sending"].indexOf(phase) >= 0;
    if (!on) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [phase]);

  const deadlineMs = session && session.deadline ? new Date(session.deadline).getTime() : 0;
  const left = deadlineMs ? deadlineMs - now : null;
  const danger = left !== null && left <= 60000 && left > 0;

  useEffect(() => {
    if (phase === "running" && left !== null && left <= 0 && exam && exam.settings.autoSubmit) submit("timer");
  }, [left, phase]);

  // Anti-cheat while the exam runs. The screen is covered the moment focus is lost, so app-switcher previews and
  // screenshots taken then show a blank panel. Each attempt is recorded and counts toward the leave-the-screen limit.
  useEffect(() => {
    if (phase !== "running") return undefined;
    const block = (e) => { e.preventDefault(); setWarn("Copying and pasting are turned off for this exam."); };
    const capture = async (why) => {
      setHidden(true);
      const now = Date.now();
      if (now - lastCap.current < 1500) return;
      lastCap.current = now;
      if (!sessionRef.current) return;
      const r = await post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: why === "leave" ? "tab" : "capture" });
      if (r.ok && r.data.locked) submit("tab-limit");
    };
    const onVis = () => { if (document.hidden) capture("leave"); };
    const onBlur = () => capture("leave");
    const onPrint = () => capture("capture");
    const onFs = () => {
      if (!exam || !exam.settings.requireFullscreen || document.fullscreenElement || !sessionRef.current) return;
      setWarn("Please stay in full screen. This is recorded.");
      post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: "fullscreen" });
    };
    const kill = (e) => {
      const k = e.key.toLowerCase();
      const shot = k === "printscreen" || ((e.metaKey || e.ctrlKey) && e.shiftKey && (k === "s" || k === "3" || k === "4" || k === "5"));
      if (shot) { e.preventDefault(); capture("capture"); return; }
      if ((e.ctrlKey || e.metaKey) && ["c", "x", "v", "a", "p", "s"].indexOf(k) >= 0) e.preventDefault();
    };
    const hideNow = () => { if (!document.hidden && document.hasFocus()) setHidden(false); };
    const evs = [["copy", block], ["cut", block], ["paste", block], ["contextmenu", block], ["keydown", kill], ["visibilitychange", onVis], ["fullscreenchange", onFs], ["beforeprint", onPrint], ["blur", onBlur], ["focus", hideNow]];
    evs.forEach(([n, f]) => window.addEventListener(n, f));
    return () => evs.forEach(([n, f]) => window.removeEventListener(n, f));
  }, [phase, exam]);

  async function begin(e) {
    e.preventDefault();
    setError("");
    if (info.needsName && name.trim().length < 2) { setError("Enter your full name to begin."); return; }
    if (!agreed) { setError("Tick the box to say you have read the rules and the policy."); return; }
    if (info.needsEmail && !email.trim()) { setError("Enter the email this exam was sent to."); return; }
    if (info.needsReg && !regNo.trim()) { setError("Enter your registration number."); return; }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) { setError("That email does not look right."); return; }
    setPhase("consent");
  }

  // Camera and microphone: asked for here, shown in the middle of the exam screen, never recorded in this version
  async function askCamera() {
    setCamState("asking");
    try {
      const st = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: true });
      streamRef.current = st;
      setCamState("on");
      const track = st.getVideoTracks()[0];
      if (track) track.onended = () => {
        setWarn("Your camera stopped. Turn it back on to continue. This is recorded.");
        if (sessionRef.current) post("/api/exam-event", { sessionId: sessionRef.current.sessionId, type: "camera" });
      };
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaStreamSource(new MediaStream(st.getAudioTracks()));
        const an = ctx.createAnalyser(); an.fftSize = 256; src.connect(an);
        const buf = new Uint8Array(an.fftSize);
        audioRef.current = setInterval(() => {
          an.getByteTimeDomainData(buf);
          let sum = 0; for (let i = 0; i < buf.length; i++) { const v = (buf[i] - 128) / 128; sum += v * v; }
          setLevel(Math.min(100, Math.round(Math.sqrt(sum / buf.length) * 320)));
        }, 120);
      } catch (x) { /* the meter is optional */ }
    } catch (err) {
      setCamState("denied");
    }
  }

  function takePhoto() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return "";
    const c = document.createElement("canvas");
    c.width = 320; c.height = 240;
    const g = c.getContext("2d");
    g.translate(320, 0); g.scale(-1, 1);
    g.drawImage(v, 0, 0, 320, 240);
    return c.toDataURL("image/jpeg", 0.6);
  }

  function stopMedia() {
    if (audioRef.current) clearInterval(audioRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  // Starts the exam once the consent is ticked and the camera has been checked
  async function startExam(cameraOn) {
    const snap = cameraOn ? takePhoto() : "";
    setPhoto(snap);
    if (exam.settings.requireFullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch (x) { /* the exam still runs */ }
    }
    setPhase("preparing");
    const r = await post("/api/exam-start", { token, name: name.trim(), email: email.trim(), regNumber: regNo.trim(), deviceId: dev, consent: true, cameraOn, photo: snap });
    if (!r.ok || r.data.error) {
      if (r.data.device && r.data.device.state === "completed") { setResult(r.data.device); setPhase("completed"); return; }
      if (r.data.device && r.data.device.state === "started") { setPhase("started"); return; }
      setError(r.data.error || "Could not start the exam."); setPhase(cameraOn ? "consent" : "intro"); return;
    }
    setSession({ sessionId: r.data.sessionId, deadline: r.data.deadline, questions: r.data.questions });
    setIdx(0); setAnswers({});
    setPhase("splash");
  }

  // Sending: the answers go to the server, and the screen waits until the admin has them
  async function submit(reason) {
    if (submittedRef.current) return;
    const s = sessionRef.current;
    if (!s) return;
    submittedRef.current = true;
    setSheet(false);
    setPhase("sending");
    setSendStep(1);
    let finished = false;
    const finish = (data) => {
      if (finished) return;
      finished = true;
      if (pollRef.current) clearInterval(pollRef.current);
      setSendStep(3);
      setResult({ reason, ...data });
      stopMedia();
      setTimeout(() => setPhase("done"), 650);
    };
    const started = Date.now();
    const poll = async () => {
      if (finished) return;
      try {
        const res = await fetch("/api/exam-status?sessionId=" + encodeURIComponent(s.sessionId));
        const d = await res.json();
        if (d.landed) finish({ pct: d.pct, score: d.score, total: d.total, resultMode: d.resultMode });
        else if (Date.now() - started > 9000) setSendStep(2);
        if (!finished && Date.now() - started > 60000) {
          clearInterval(pollRef.current);
          submittedRef.current = false;
          setError("We could not confirm your answers. Check your connection and press Submit again. Your answers are still here.");
          setPhase("running");
        }
      } catch (e) { /* keep trying */ }
    };
    pollRef.current = setInterval(poll, 1500);
    poll();
    const r = await post("/api/exam-submit", { sessionId: s.sessionId, answers: answersRef.current, reason });
    if (document.fullscreenElement && document.exitFullscreen) { try { await document.exitFullscreen(); } catch (x) {} }
    if (r.ok && !r.data.error) { setSendStep(2); finish({ pct: r.data.pct, score: r.data.score, total: r.data.total, resultMode: r.data.received ? "admin" : "instant" }); }
  }

  // ---------- screens ----------
  if (phase === "loading") return html`<${Screen}><div style=${{ margin: "auto" }}><div class="ex-spin" style=${{ width: "34px", height: "34px", borderRadius: "50%", border: "3px solid " + LINE, borderTopColor: BLUE }}></div></div><//>`;

  if (phase === "invalid") return html`<${Screen}><div class="ex-rise" style=${{ margin: "auto", maxWidth: "440px", padding: "28px", textAlign: "center" }}>
    <${Mark} tone="#fee2e2" label=${html`<span style=${{ color: RED, fontSize: "34px", fontWeight: 800 }}>!</span>`} />
    <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "22px 0 10px" }}>This exam can't be opened</h1>
    <p style=${{ color: MUTED, lineHeight: 1.6, margin: 0 }}>${error}</p>
  </div><//>`;

  if (phase === "completed" || phase === "started") {
    const completed = phase === "completed";
    const showScore = completed && result && result.state === "completed" && result.resultMode === "instant";
    return html`<${Screen}><div class="ex-rise" style=${{ margin: "auto", width: "min(440px, 100% - 40px)", background: "#fff", border: "1px solid " + LINE, borderRadius: "28px", padding: "34px 26px", textAlign: "center", boxShadow: "0 30px 60px -36px rgba(15,18,108,.5)" }}>
      <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: BLUE, margin: "0 0 14px" }}>${exam ? exam.title : "Examination"}</p>
      ${showScore ? html`<div class="ex-fade"><${Ring} pct=${result.pct} color=${result.pct >= 50 ? BLUE : RED} /></div>` : html`<${Mark} tone=${completed ? NAVY : "#94a3b8"} />`}
      <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "23px", fontWeight: 800, color: NAVY, margin: "20px 0 10px", lineHeight: 1.2 }}>
        ${completed ? "You have taken this exam" : "This exam was already started"}</h1>
      <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 4px" }}>
        ${completed ? "Your answers have been received. This device can't open the exam again." : "This device has already begun the exam. If you need help, contact the academy."}</p>
      ${showScore ? html`<p style=${{ color: INK, fontWeight: 700, margin: "12px 0 0" }}>${result.score} of ${result.total} correct</p>` : null}
    </div></${Screen}>`;
  }

  if (phase === "intro") {
    const s = exam.settings;
    const rules = [
      exam.timerMinutes ? ["Time", exam.timerMinutes + " minute" + (exam.timerMinutes === 1 ? "" : "s") + ". Answers are sent when time runs out."] : null,
      s.oneAttempt ? ["One attempt", "You can take this exam once, on this device."] : null,
      s.requireFullscreen ? ["Full screen", "The exam runs full screen. Stay in it until you finish."] : null,
      ["Leaving", "Leaving the screen is recorded" + (s.tabSwitchAllowed ? ". You may leave " + s.tabSwitchAllowed + " time(s) before it is sent for you." : ".")],
      ["Copying", "Copy, paste and right-click are turned off."],
      s.shuffle ? ["Order", "Questions may appear in a different order from others."] : null,
      ["Result", s.resultMode === "instant" ? "Your score shows as soon as you submit." : "The academy will be in touch with your result."]
    ].filter(Boolean);
    return html`<div style=${{ position: "fixed", inset: 0, overflowY: "auto", background: "linear-gradient(180deg,#eef4ff 0%,#f8fafc 65%)", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
      <style>${CSS}</style>
      <form onSubmit=${begin} style=${{ maxWidth: "560px", margin: "0 auto", padding: "26px 20px 150px" }}>
        <p class="ex-rise" style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: BLUE, margin: "0 0 10px" }}>Examination</p>
        <h1 class="ex-rise" style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "32px", fontWeight: 800, color: NAVY, margin: "0 0 12px", lineHeight: 1.1 }}>${exam.title}</h1>
        ${exam.description ? html`<p class="ex-rise" style=${{ color: INK, lineHeight: 1.65, margin: "0 0 24px", whiteSpace: "pre-line" }}>${exam.description}</p>` : html`<div style=${{ height: "18px" }}></div>`}
        <div class="ex-rise" style=${{ background: "#fff", border: "1px solid " + LINE, borderRadius: "24px", overflow: "hidden", marginBottom: "22px" }}>
          ${rules.map(([k, v], i) => html`<div key=${k} style=${{ display: "grid", gridTemplateColumns: "104px 1fr", gap: "12px", padding: "15px 18px", borderTop: i ? "1px solid " + LINE : "none" }}>
            <span style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: NAVY, paddingTop: "3px" }}>${k}</span>
            <span style=${{ fontSize: "14px", lineHeight: 1.55, color: INK }}>${v}</span>
          </div>`)}
        </div>
        <label style=${{ display: "block", fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: MUTED, margin: "0 0 8px" }}>${info.needsName ? "Your full name" : "Full name (optional)"}</label>
        <input value=${name} onInput=${(e) => setName(e.target.value)} placeholder="As you want it recorded" style=${{ width: "100%", border: "1px solid " + LINE, borderRadius: "18px", padding: "16px", font: "inherit", fontSize: "16px", boxSizing: "border-box", background: "#fff" }} />
        ${info.needsEmail || info.needsReg ? html`<div style=${{ marginTop: "16px", display: "grid", gap: "10px" }}>
          ${info.needsEmail ? html`<div><label style=${{ display: "block", fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: MUTED, margin: "0 0 8px" }}>Your email</label>
            <input type="email" value=${email} onInput=${(e) => setEmail(e.target.value)} placeholder="Your email" style=${{ width: "100%", border: "1px solid " + LINE, borderRadius: "18px", padding: "16px", font: "inherit", fontSize: "16px", boxSizing: "border-box", background: "#fff" }} /></div>` : null}
          ${info.needsReg ? html`<div><label style=${{ display: "block", fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: MUTED, margin: "0 0 8px" }}>Registration number</label>
            <input value=${regNo} onInput=${(e) => setRegNo(e.target.value)} placeholder="Your registration number" style=${{ width: "100%", border: "1px solid " + LINE, borderRadius: "18px", padding: "16px", font: "inherit", fontSize: "16px", boxSizing: "border-box", background: "#fff" }} /></div>` : null}
        </div>` : null}
        ${error ? html`<p class="ex-fade" style=${{ color: RED, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "11px 13px", margin: "14px 0 0", fontSize: "14px" }}>${error}</p>` : null}
        <details class="ex-rise" style=${{ marginTop: "18px", background: "#fff", border: "1px solid " + LINE, borderRadius: "20px", padding: "14px 18px" }}>
          <summary style=${{ fontWeight: 800, color: NAVY, cursor: "pointer" }}>Camera, microphone and privacy policy</summary>
          <div style=${{ marginTop: "12px", fontSize: "14px", lineHeight: 1.65, color: INK }}>
            <p style=${{ margin: "0 0 10px" }}><strong>Camera.</strong> Your front camera is on during the exam. It shows in a small frame in the middle of your screen. It is not recorded in this version.</p>
            <p style=${{ margin: "0 0 10px" }}><strong>Microphone.</strong> Your microphone is switched on so the academy can confirm it is you. Nothing is recorded in this version.</p>
            <p style=${{ margin: "0 0 10px" }}><strong>Identity photo.</strong> One photo is taken when you begin. Staff can compare it with the name you typed.</p>
            <p style=${{ margin: "0 0 10px" }}><strong>Screen activity.</strong> Leaving the exam, switching apps, printing, or taking a screenshot is recorded. The screen is covered when this happens.</p>
            <p style=${{ margin: "0 0 10px" }}><strong>Who sees it.</strong> Only academy staff running this exam.</p>
            <p style=${{ margin: "0 0 10px" }}><strong>How long.</strong> The academy keeps this only as long as needed for your result. You can ask for it to be deleted.</p>
            <p style=${{ margin: 0 }}><strong>If you refuse.</strong> The exam needs your camera and microphone. If you refuse, you will not be able to start it.</p>
          </div>
        </details>
        <label style=${{ display: "flex", gap: "12px", alignItems: "flex-start", background: "#fff", border: "1px solid " + (agreed ? BLUE : LINE), borderRadius: "18px", padding: "14px 16px", cursor: "pointer", marginTop: "14px" }}>
          <input type="checkbox" checked=${agreed} onChange=${(e) => setAgreed(e.target.checked)} style=${{ marginTop: "3px", width: "18px", height: "18px", accentColor: BLUE }} />
          <span style=${{ fontSize: "14px", lineHeight: 1.5 }}>I have read the rules, the camera and microphone policy, and the privacy notice, and I agree to them for this exam.</span>
        </label>
        <div style=${{ position: "fixed", left: 0, right: 0, bottom: 0, padding: "14px 20px calc(16px + env(safe-area-inset-bottom, 0px))", background: "rgba(248,250,252,.94)", backdropFilter: "blur(10px)", borderTop: "1px solid " + LINE }}>
          <div style=${{ maxWidth: "560px", margin: "0 auto" }}>
            <button type="submit" disabled=${!agreed} style=${{ width: "100%", height: "56px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", letterSpacing: ".02em", cursor: agreed ? "pointer" : "not-allowed", opacity: agreed ? 1 : .45, boxShadow: "0 16px 28px -16px rgba(15,18,108,.8)" }}>Begin the exam</button>
          </div>
        </div>
      </form>
    </div>`;
  }

  if (phase === "consent") {
    const cameraRequired = exam.settings.requireCamera;
    const items = [
      ["Camera", "Your front camera is on during the exam and shows in a small frame in the middle of your screen."],
      ["Microphone", "Your microphone is on so the academy can confirm it is you. Nothing is recorded in this version."],
      ["Identity", "One photo is taken when you begin. Staff can compare it with the name you typed."],
      ["Screen", "Leaving the exam, switching apps, printing or taking a screenshot is recorded, and the screen is covered."],
      ["Who sees it", "Only academy staff running this exam. The academy keeps it only as long as needed for the result, and deletes it on request."]
    ];
    return html`<div style=${{ position: "fixed", inset: 0, overflowY: "auto", background: "linear-gradient(180deg,#eef4ff 0%,#f8fafc 65%)", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
      <style>${CSS}</style>
      <div class="ex-rise" style=${{ maxWidth: "560px", margin: "0 auto", padding: "26px 20px 40px" }}>
        <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: BLUE, margin: "0 0 10px" }}>Before you begin</p>
        <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "26px", fontWeight: 800, color: NAVY, margin: "0 0 14px", lineHeight: 1.15 }}>Camera, microphone and privacy</h1>
        <div style=${{ background: "#fff", border: "1px solid " + LINE, borderRadius: "22px", overflow: "hidden", marginBottom: "18px" }}>
          ${items.map(([k, v], i) => html`<div key=${k} style=${{ display: "grid", gridTemplateColumns: "100px 1fr", gap: "12px", padding: "13px 16px", borderTop: i ? "1px solid " + LINE : "none" }}>
            <span style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: NAVY, paddingTop: "3px" }}>${k}</span>
            <span style=${{ fontSize: "14px", lineHeight: 1.5 }}>${v}</span>
          </div>`)}
        </div>
        <div style=${{ background: "#fff", border: "1px solid " + LINE, borderRadius: "22px", padding: "18px", marginBottom: "18px", textAlign: "center" }}>
          ${camState === "on" ? html`<div>
            <div style=${{ margin: "0 auto", width: "100%", maxWidth: "300px", display: "flex", gap: "10px", alignItems: "stretch" }}>
            <div style=${{ flex: "1", aspectRatio: "1 / 1", borderRadius: "20px", overflow: "hidden", background: "#0b1020", position: "relative", border: "3px solid " + (bright >= BRIGHT_MIN && faceOk ? GREEN : RED) }}>
              <video ref=${(el) => { videoRef.current = el; if (el && streamRef.current && el.srcObject !== streamRef.current) { el.srcObject = streamRef.current; el.play && el.play().catch(() => {}); } }} autoPlay muted playsInline style=${{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}></video>
            </div>
            <div style=${{ width: "10px", borderRadius: "999px", background: LINE, position: "relative", overflow: "hidden" }}><span style=${{ position: "absolute", bottom: 0, left: 0, right: 0, height: bright + "%", background: bright >= BRIGHT_MIN ? GREEN : RED, transition: "height .3s" }}></span></div>
            </div>
            <p style=${{ margin: "14px 0 6px", fontSize: "13px", color: bright >= BRIGHT_MIN ? GREEN : RED, fontWeight: 700 }}>${bright >= BRIGHT_MIN ? "Brightness is good. You can take your photo." : "Too dark. Move to a brighter area, face the light, then try again."}</p>
            <p style=${{ margin: "0 0 8px", fontSize: "13px", color: faceOk ? GREEN : RED, fontWeight: 700 }}>${faceMsg}</p>
            <p style=${{ margin: "0 0 8px", fontSize: "13px", color: MUTED }}>Keep your face in the square. Say something to test the microphone.</p>
            <div class="ex-meter" style=${{ maxWidth: "300px", margin: "0 auto" }}><span style=${{ width: level + "%" }}></span></div>
          </div>` : null}
          ${camState === "denied" ? html`<div class="ex-fade">
            <p style=${{ color: RED, fontWeight: 700, margin: "0 0 6px" }}>Camera or microphone not allowed</p>
            <p style=${{ color: MUTED, fontSize: "14px", lineHeight: 1.55, margin: "0 0 14px" }}>Allow both in your browser settings for this site, then try again.${cameraRequired ? "" : " This exam can also run without them."}</p>
            <div style=${{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
              <button type="button" onClick=${askCamera} style=${{ height: "46px", padding: "0 20px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Try again</button>
              ${cameraRequired ? null : html`<button type="button" onClick=${() => { setCamState("off"); }} style=${{ height: "46px", padding: "0 20px", borderRadius: "999px", border: "1px solid " + LINE, background: "#fff", color: NAVY, fontWeight: 800, cursor: "pointer" }}>Continue without camera</button>`}
            </div>
          </div>` : null}
          ${camState === "idle" || camState === "asking" ? html`<div>
            <p style=${{ color: MUTED, fontSize: "14px", margin: "0 0 14px" }}>Allow your camera and microphone to continue.</p>
            <button type="button" disabled=${camState === "asking"} onClick=${askCamera} style=${{ height: "50px", padding: "0 24px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, cursor: "pointer", opacity: camState === "asking" ? .6 : 1 }}>${camState === "asking" ? "Waiting for permission…" : "Allow camera and microphone"}</button>
          </div>` : null}
        </div>
          <p style=${{ color: MUTED, fontSize: "13px", margin: "0 0 18px", lineHeight: 1.5 }}>You agreed to the rules and policy on the first screen. Next, allow the camera so the academy can confirm it is you.</p>
        ${error ? html`<p class="ex-fade" style=${{ color: RED, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "11px 13px", margin: "0 0 14px", fontSize: "14px" }}>${error}</p>` : null}
        <button type="button" disabled=${(camState !== "on" && cameraRequired && camState !== "off") || (camState === "on" && (bright < BRIGHT_MIN || !faceOk))} onClick=${() => startExam(camState === "on")} style=${{ width: "100%", height: "56px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer", opacity: ((camState !== "on" && cameraRequired && camState !== "off") || (camState === "on" && (bright < BRIGHT_MIN || !faceOk))) ? .45 : 1 }}>${camState === "on" ? "Take my photo and begin" : "Begin the exam"}</button>
      </div>
    </div>`;
  }

  if (phase === "preparing" || phase === "splash") return html`<${Screen} bg="linear-gradient(160deg,#0f126c 0%,#0948e6 100%)"><div class="ex-fade" style=${{ margin: "auto", textAlign: "center", color: "#fff" }}>
    <div class="ex-pulse" style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "38px", fontWeight: 900, letterSpacing: ".06em" }}>CGTIA</div>
    <div style=${{ marginTop: "12px", fontSize: "12px", opacity: .85, letterSpacing: ".16em", textTransform: "uppercase" }}>${phase === "preparing" ? "Preparing your exam" : "Good luck"}</div>
    <div class="ex-spin" style=${{ width: "26px", height: "26px", margin: "26px auto 0", borderRadius: "50%", border: "3px solid rgba(255,255,255,.3)", borderTopColor: "#fff" }}></div>
  </div><//>`;

  if (phase === "sending") {
    const steps = [["Checking your answers", 1], ["Saving your exam", 2], ["Confirming with the academy", 3]];
    return html`<${Screen}><div class="ex-fade" style=${{ margin: "auto", width: "min(360px, 100% - 40px)", textAlign: "center" }}>
      <div style=${{ width: "78px", height: "78px", margin: "0 auto", position: "relative" }}>
        <div class="ex-spin" style=${{ position: "absolute", inset: 0, borderRadius: "50%", border: "4px solid " + LINE, borderTopColor: BLUE }}></div>
        <div class="ex-pulse" style=${{ position: "absolute", inset: "18px", borderRadius: "50%", background: sendStep >= 3 ? GREEN : BLUE }}></div>
      </div>
      <h2 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "21px", fontWeight: 800, color: NAVY, margin: "26px 0 18px" }}>${sendStep >= 3 ? "Your exam is in" : "Sending your answers"}</h2>
      <div style=${{ display: "grid", gap: "10px", textAlign: "left", background: "#fff", border: "1px solid " + LINE, borderRadius: "20px", padding: "16px 18px" }}>
        ${steps.map(([t, n]) => html`<div key=${t} style=${{ display: "flex", alignItems: "center", gap: "12px", fontSize: "14px", color: sendStep >= n ? INK : MUTED, fontWeight: sendStep >= n ? 700 : 500 }}>
          <span style=${{ width: "22px", height: "22px", borderRadius: "50%", display: "grid", placeItems: "center", background: sendStep > n || (sendStep >= 3 && n === 3) ? GREEN : (sendStep === n ? BLUE : LINE), color: "#fff", fontSize: "12px", fontWeight: 800, flex: "0 0 auto" }}>${sendStep > n || (sendStep >= 3 && n === 3) ? "✓" : ""}</span>
          ${t}
        </div>`)}
      </div>
      ${sendStep === 2 ? html`<p class="ex-fade" style=${{ color: MUTED, fontSize: "12px", marginTop: "14px", lineHeight: 1.5 }}>This is taking a little longer than usual. Keep this page open.</p>` : null}
    </div><//>`;
  }

  if (phase === "done") {
    const instant = result && result.pct != null && result.resultMode !== "admin";
    return html`<${Screen}><div class="ex-rise" style=${{ margin: "auto", width: "min(440px, 100% - 40px)", background: "#fff", border: "1px solid " + LINE, borderRadius: "28px", padding: "34px 26px", textAlign: "center", boxShadow: "0 30px 60px -36px rgba(15,18,108,.5)" }}>
      <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: BLUE, margin: "0 0 14px" }}>${exam.title}</p>
      ${instant ? html`<div class="ex-fade"><${Ring} pct=${result.pct} color=${result.pct >= 50 ? BLUE : RED} /></div>` : html`<${Mark} tone=${GREEN} />`}
      <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "23px", fontWeight: 800, color: NAVY, margin: "20px 0 10px" }}>${instant ? "Your result" : "Thank you"}</h1>
      <p style=${{ color: MUTED, lineHeight: 1.6, margin: 0 }}>${instant ? result.score + " of " + result.total + " correct. Your answers are saved." : "Your answers have been received. The academy will be in touch with your result."}</p>
      <p style=${{ color: MUTED, fontSize: "12px", margin: "18px 0 0" }}>You can close this page now.</p>
    </div></${Screen}>`;
  }

  // ---------- running: one question per screen, nothing scrolls ----------
  const qs = session.questions || [];
  const q = qs[idx];
  const answered = Object.keys(answers).length;
  const last = idx === qs.length - 1;
  const pick = (oi) => setAnswers({ ...answers, [q.i]: oi });
  const timerTone = danger ? RED : NAVY;

  return html`<${Screen}>
    <div style=${{ flex: "0 0 auto", padding: "calc(14px + env(safe-area-inset-top, 0px)) 18px 12px", background: "rgba(255,255,255,.85)", backdropFilter: "blur(10px)", borderBottom: "1px solid " + LINE, zIndex: 2 }}>
      <div style=${{ maxWidth: "640px", margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style=${{ minWidth: 0 }}>
          <div style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: MUTED }}>Question ${idx + 1} of ${qs.length}</div>
          <div style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontWeight: 800, color: NAVY, fontSize: "15px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>${exam.title}</div>
        </div>
        <div class=${danger ? "ex-shake" : ""} style=${{ flex: "0 0 auto", fontFamily: "Montserrat, Inter, sans-serif", fontWeight: 800, fontSize: "20px", fontVariantNumeric: "tabular-nums", color: timerTone, padding: "7px 14px", borderRadius: "999px", background: danger ? "#fef2f2" : "#fff", border: "1px solid " + (danger ? "#fecaca" : LINE) }}>${left !== null ? clock(left) : "—"}</div>
      </div>
      <div style=${{ maxWidth: "640px", margin: "10px auto 0", height: "5px", background: LINE, borderRadius: "999px", overflow: "hidden" }}>
        <div style=${{ height: "100%", width: ((idx + 1) / Math.max(1, qs.length)) * 100 + "%", background: "linear-gradient(90deg," + BLUE + "," + NAVY + ")", borderRadius: "999px", transition: "width .4s ease" }}></div>
      </div>
    </div>
    ${camState === "on" && (bright < BRIGHT_MIN || !faceOk) ? html`<div class="ex-fade" style=${{ position: "absolute", top: "calc(186px + env(safe-area-inset-top,0px))", left: "50%", transform: "translateX(-50%)", zIndex: 3, background: "#fef3c7", color: "#92400e", borderRadius: "999px", padding: "5px 12px", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>${bright < BRIGHT_MIN ? "Too dark. Move somewhere brighter." : faceMsg}</div>` : null}
    ${camState === "on" ? html`<div class="ex-cam" style=${{ border: "3px solid " + (bright >= BRIGHT_MIN && faceOk ? GREEN : RED) }} aria-label="Your camera"><video ref=${(el) => { videoRef.current = el; if (el && streamRef.current && el.srcObject !== streamRef.current) { el.srcObject = streamRef.current; el.play && el.play().catch(() => {}); } }} autoPlay muted playsInline></video><div style=${{ position: "absolute", right: "6px", top: "8px", bottom: "8px", width: "6px", borderRadius: "999px", background: "rgba(255,255,255,.35)", overflow: "hidden" }}><span style=${{ position: "absolute", left: 0, right: 0, bottom: 0, height: bright + "%", background: bright >= BRIGHT_MIN ? GREEN : RED }}></span></div></div>` : null}
    ${hidden ? html`<div class="ex-cover" role="alert"><div style=${{ maxWidth: "320px" }}><div style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "22px", fontWeight: 800, marginBottom: "10px" }}>Screen hidden</div><p style=${{ opacity: .8, lineHeight: 1.6, margin: "0 0 18px" }}>This was recorded. Return to the exam to continue.</p><button type="button" onClick=${() => setHidden(false)} style=${{ height: "48px", padding: "0 22px", borderRadius: "999px", border: 0, background: "#fff", color: NAVY, fontWeight: 800, cursor: "pointer" }}>Return to the exam</button></div></div>` : null}
    ${warn ? html`<div class="ex-fade" role="alert" style=${{ maxWidth: "640px", width: "calc(100% - 36px)", margin: "10px auto 0", color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "9px 12px", fontSize: "13px", boxSizing: "border-box" }}>${warn}</div>` : null}
    <div style=${{ flex: "1 1 auto", minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: "640px", width: "100%", margin: "0 auto", padding: "16px 18px", boxSizing: "border-box" }}>
      <div style=${{ maxHeight: "100%", overflow: "hidden" }}>
        <h2 key=${"q" + idx} class="ex-rise" style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "21px", fontWeight: 800, color: INK, margin: "0 0 16px", lineHeight: 1.3, userSelect: "none", WebkitUserSelect: "none" }}>${q ? q.prompt : ""}</h2>
        <div style=${{ display: "grid", gap: "10px" }}>
          ${q ? q.options.map((o, oi) => {
            const on = answers[q.i] === oi;
            return html`<button key=${oi} type="button" onClick=${() => pick(oi)} style=${{ display: "flex", alignItems: "center", gap: "14px", textAlign: "left", width: "100%", minHeight: "56px", padding: "14px 16px", borderRadius: "18px", border: "1.5px solid " + (on ? BLUE : LINE), background: on ? "#eef4ff" : "#fff", color: INK, font: "inherit", fontSize: "16px", cursor: "pointer", boxSizing: "border-box" }}>
              <span style=${{ width: "22px", height: "22px", borderRadius: "50%", border: "2px solid " + (on ? BLUE : "#94a3b8"), display: "grid", placeItems: "center", flex: "0 0 auto" }}>${on ? html`<span style=${{ width: "10px", height: "10px", borderRadius: "50%", background: BLUE }}></span>` : null}</span>
              <span>${o}</span>
            </button>`;
          }) : null}
        </div>
      </div>
    </div>
    ${error ? html`<p style=${{ color: RED, fontSize: "13px", maxWidth: "640px", width: "calc(100% - 36px)", margin: "0 auto 8px", boxSizing: "border-box" }}>${error}</p>` : null}
    <div style=${{ flex: "0 0 auto", padding: "12px 18px calc(16px + env(safe-area-inset-bottom, 0px))", background: "rgba(255,255,255,.9)", borderTop: "1px solid " + LINE }}>
      <div style=${{ maxWidth: "640px", margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: "10px" }}>
        <button type="button" disabled=${idx === 0} onClick=${() => setIdx(idx - 1)} style=${{ height: "52px", padding: "0 20px", borderRadius: "999px", border: "1px solid " + LINE, background: "#fff", color: NAVY, fontWeight: 800, opacity: idx === 0 ? .4 : 1, cursor: "pointer" }}>Back</button>
        ${last
          ? html`<button type="button" onClick=${() => setSheet(true)} style=${{ height: "52px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer" }}>Submit exam</button>`
          : html`<button type="button" onClick=${() => setIdx(idx + 1)} style=${{ height: "52px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer" }}>Next</button>`}
      </div>
    </div>
    ${sheet ? html`<div class="ex-fade" role="dialog" aria-modal="true" aria-label="Submit your exam" onClick=${() => setSheet(false)} style=${{ position: "fixed", inset: 0, background: "rgba(8,12,40,.45)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 50 }}>
      <div class="ex-rise" onClick=${(e) => e.stopPropagation()} style=${{ width: "100%", maxWidth: "560px", background: "#fff", borderRadius: "28px 28px 0 0", padding: "22px 22px calc(22px + env(safe-area-inset-bottom, 0px))", boxSizing: "border-box" }}>
        <div style=${{ width: "44px", height: "5px", borderRadius: "999px", background: LINE, margin: "0 auto 18px" }}></div>
        <h3 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "21px", fontWeight: 800, color: NAVY, margin: "0 0 8px" }}>Submit your exam?</h3>
        <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 14px" }}>You have answered <strong style=${{ color: INK }}>${answered} of ${qs.length}</strong>. Your answers can't be changed after you submit.</p>
        ${answered < qs.length ? html`<p style=${{ color: "#92400e", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "14px", padding: "10px 12px", fontSize: "13px", margin: "0 0 14px" }}>${qs.length - answered} question(s) are still unanswered.</p>` : null}
        <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
          <button type="button" onClick=${() => setSheet(false)} style=${{ height: "54px", borderRadius: "999px", border: "1px solid " + LINE, background: "#fff", color: NAVY, fontWeight: 800, cursor: "pointer" }}>Keep going</button>
          <button type="button" onClick=${() => submit("manual")} style=${{ height: "54px", borderRadius: "999px", border: 0, background: NAVY, color: "#fff", fontWeight: 800, cursor: "pointer" }}>Submit</button>
        </div>
      </div>
    </div>` : null}
  </${Screen}>`;
}
