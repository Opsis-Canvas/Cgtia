
import { createElement, useCallback, useState, useEffect } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { Avatar, Empty, StatusChip, ImageSlot, formatPayDate, money, loadProgress, markLessonDone, setModulePassed } from "./shared.js";
import { ASSETS } from "./assets.js";
import { MenuDrawer } from "./drawer.view.js";

const html = htm.bind(createElement);
const TILE_TONE = { courses: "sky", grades: "lilac", fees: "mint" };

function BackBtn({ label, onClick }) {
  return html`<div class="page-head-row">
    <button type="button" class="back-circle" aria-label=${label || "Back"} onClick=${onClick}>
      ${Icon({ name: "back", size: 20 })}
    </button>
    ${label ? html`<span class="sr-only">${label}</span>` : null}
  </div>`;
}

function PageHead({ backLabel, onBack, title, sub }) {
  return html`<div class="page-head">
    <div class="page-head-row">
      ${onBack ? html`<button type="button" class="back-circle" aria-label=${backLabel || "Back"} onClick=${onBack}>
        ${Icon({ name: "back", size: 20 })}
      </button>` : null}
      <div class="page-titles">
        <h1 class="display">${title}</h1>
        ${sub ? html`<p>${sub}</p>` : null}
      </div>
    </div>
  </div>`;
}


/** Polished MCQ with pass/fail animation. */
function MiniQuiz({ title, subtitle, questions, passPercent, onPass, onBack, failHint }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const qs = questions || [];

  function submit() {
    let score = 0;
    qs.forEach((q, i) => {
      if (q.correct != null && String(answers[i]) === String(q.correct)) score += 1;
    });
    const total = qs.length || 1;
    const pct = Math.round((score / total) * 100);
    const ok = pct >= (passPercent || 70);
    setResult({ score, total, pct, ok });
  }

  if (!qs.length) {
    return html`<div class="quiz-shell">
      <${PageHead} title=${title} onBack=${onBack} backLabel="Back" />
      <${Empty} title="No questions" body="This check has no questions yet." />
    </div>`;
  }

  if (result) {
    return html`<div class="quiz-shell">
      <${PageHead} title=${title} sub=${subtitle || ""} onBack=${onBack} backLabel="Back" />
      <div class=${"quiz-result-card " + (result.ok ? "ok" : "bad")}>
        <div class="emoji">${result.ok ? "✓" : "!"}</div>
        <h3>${result.ok ? "You passed" : "Not quite yet"}</h3>
        <div class="quiz-score-ring">${result.pct}%</div>
        <p>${result.score} of ${result.total} correct · need ${passPercent}%</p>
        ${result.ok
          ? html`<div class="btn-row"><button type="button" class="btn-block" onClick=${onPass}>Continue</button></div>`
          : html`<p style=${{ marginTop: 8 }}>${failHint || "Review the lesson, then try again."}</p>
              <div class="btn-row">
                <button type="button" class="btn-block" onClick=${() => { setResult(null); setAnswers({}); setIdx(0); }}>Try again</button>
                <button type="button" class="btn-block secondary" onClick=${onBack}>Back to lesson</button>
              </div>`}
      </div>
    </div>`;
  }

  const q = qs[idx];
  return html`<div class="quiz-shell">
    <${PageHead} title=${title} sub=${(subtitle || "") + " · Q " + (idx + 1) + "/" + qs.length} onBack=${onBack} backLabel="Back" />
    <div class="quiz-progress">
      ${qs.map((_, i) => html`<i key=${i} class=${i <= idx ? "on" : ""}></i>`)}
    </div>
    <div class="quiz-card">
      <h3>${q.prompt || q.text || "Question"}</h3>
      ${(q.options || []).map((opt, oi) => html`<label class=${"quiz-opt" + (String(answers[idx]) === String(oi) ? " on" : "")} key=${oi}>
        <input type="radio" name=${"mq" + idx} checked=${String(answers[idx]) === String(oi)}
          onChange=${() => setAnswers({ ...answers, [idx]: oi })} />
        <span>${opt}</span>
      </label>`)}
      <div class="btn-row">
        <button type="button" class="btn-block" disabled=${answers[idx] == null}
          style=${{ opacity: answers[idx] == null ? 0.45 : 1 }}
          onClick=${() => {
            if (answers[idx] == null) return;
            if (idx + 1 >= qs.length) submit();
            else setIdx(idx + 1);
          }}>${idx + 1 >= qs.length ? "Submit answers" : "Next question"}</button>
        ${idx > 0 ? html`<button type="button" class="btn-block secondary" onClick=${() => setIdx(idx - 1)}>Previous</button>` : null}
      </div>
    </div>
  </div>`;
}

function LessonRingNav({ lessons, prog, cid, currentId, onPick, onClose }) {
  const n = Math.max(lessons.length, 1);
  const cur = lessons.findIndex((l, i) => String(l.id != null ? l.id : i) === String(currentId));
  const curL = cur >= 0 ? lessons[cur] : null;
  return html`<div class="ring-backdrop" onClick=${onClose}>
    <div class="ring-sheet" onClick=${(e) => e.stopPropagation()}>
      <h4>Jump to a lesson</h4>
      <p class="ring-sub">Completed lessons light up green</p>
      <div class="ring-wrap">
        <svg class="ring-svg" viewBox="0 0 100 100" aria-hidden="true">
          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="3" />
        </svg>
        <div class="ring-center">
          <strong>${curL?.title || "Select"}</strong>
          <span>${cur >= 0 ? (cur + 1) + " of " + lessons.length : lessons.length + " lessons"}</span>
        </div>
        ${lessons.map((ls, i) => {
          const id = String(ls.id != null ? ls.id : i);
          const ang = (-90 + (360 / n) * i) * (Math.PI / 180);
          const x = 50 + 42 * Math.cos(ang);
          const y = 50 + 42 * Math.sin(ang);
          const done = prog.completed.includes(id);
          const open = i === 0 || prog.completed.includes(String(lessons[i - 1].id != null ? lessons[i - 1].id : (i - 1)));
          const current = String(currentId) === id;
          const cls = "ring-dot" + (done ? " done" : "") + (current ? " current" : "") + (!open ? " locked" : "");
          return html`<button type="button" key=${id} class=${cls}
            style=${{ left: x + "%", top: y + "%" }}
            disabled=${!open}
            onClick=${() => { if (open) onPick(id); }}>
            ${String(i + 1).padStart(2, "0")}
          </button>`;
        })}
      </div>
      <button type="button" class="btn-block secondary" style=${{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.2)" }} onClick=${onClose}>Close</button>
    </div>
  </div>`;
}




const FONT_STEPS = ["sm", "md", "lg", "xl"];
function loadFontStep() {
  try {
    const v = localStorage.getItem("cgtia_lesson_font");
    const i = FONT_STEPS.indexOf(v);
    return i >= 0 ? i : 1;
  } catch (_) { return 1; }
}
function saveFontStep(i) {
  try { localStorage.setItem("cgtia_lesson_font", FONT_STEPS[i] || "md"); } catch (_) {}
}

/** Split text into speakable chunks (sentences). */
function chunkText(text) {
  const t = String(text || "").replace(/\s+/g, " ").trim();
  if (!t) return [];
  const parts = t.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [t];
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * In-lesson TTS player: play/pause, back one chunk, speed cycle.
 * Uses Web Speech API (free, on-device). No API key.
 */
function LessonTtsPlayer({ text, title }) {
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [chunkIdx, setChunkIdx] = useState(0);
  const [speed, setSpeed] = useState(1);
  const chunks = chunkText(text);
  const total = chunks.length || 1;
  const speeds = [0.75, 1, 1.25, 1.5];

  useEffect(() => {
    return () => { try { speechSynthesis.cancel(); } catch (_) {} };
  }, []);

  useEffect(() => {
    try { speechSynthesis.cancel(); } catch (_) {}
    setPlaying(false);
    setChunkIdx(0);
    setOpen(false);
  }, [text]);

  function speakFrom(start) {
    if (!chunks.length || typeof speechSynthesis === "undefined") return;
    speechSynthesis.cancel();
    let i = Math.max(0, Math.min(start, chunks.length - 1));
    setChunkIdx(i);
    function run(j) {
      if (j >= chunks.length) {
        setPlaying(false);
        setChunkIdx(0);
        return;
      }
      setChunkIdx(j);
      const u = new SpeechSynthesisUtterance(chunks[j]);
      u.lang = "en-NG";
      u.rate = speed;
      u.onend = () => run(j + 1);
      u.onerror = () => setPlaying(false);
      setPlaying(true);
      speechSynthesis.speak(u);
    }
    run(i);
  }

  function togglePlay() {
    if (!chunks.length) return;
    if (playing) {
      try { speechSynthesis.cancel(); } catch (_) {}
      setPlaying(false);
      return;
    }
    speakFrom(chunkIdx);
  }

  function skipBack() {
    const next = Math.max(0, chunkIdx - 1);
    if (playing) speakFrom(next);
    else setChunkIdx(next);
  }

  function cycleSpeed() {
    const i = speeds.indexOf(speed);
    const n = speeds[(i + 1) % speeds.length];
    setSpeed(n);
    if (playing) setTimeout(() => speakFrom(chunkIdx), 30);
  }

  function closePlayer() {
    try { speechSynthesis.cancel(); } catch (_) {}
    setPlaying(false);
    setOpen(false);
  }

  if (!chunks.length) return null;
  const pct = Math.round(((chunkIdx + (playing ? 0.5 : 0)) / total) * 100);

  if (!open) {
    return html`<button type="button" class=${"tts-fab" + (playing ? " playing" : "")}
      aria-label="Listen" onClick=${() => setOpen(true)}>
      ${Icon({ name: "speaker", size: 22 })}
    </button>`;
  }

  return html`<div class="tts-player">
    <div class="tts-player-top">
      <div class="meta">
        <strong>${title || "Listen"}</strong>
        <span>${playing ? "Playing" : "Paused"} · ${Math.min(chunkIdx + 1, total)}/${total}</span>
      </div>
      <button type="button" class="tts-close" aria-label="Close" onClick=${closePlayer}>×</button>
    </div>
    <div class="tts-prog"><i style=${{ width: Math.min(100, pct) + "%" }}></i></div>
    <div class="tts-controls">
      <button type="button" aria-label="Back" onClick=${skipBack}>↺</button>
      <button type="button" class="primary" aria-label=${playing ? "Pause" : "Play"} onClick=${togglePlay}>
        ${playing ? "❚❚" : "▶"}
      </button>
      <button type="button" class="speed" aria-label="Speed" onClick=${cycleSpeed}>${speed}x</button>
    </div>
  </div>`;
}

function LessonView({ section, courses, student, setSection }) {
  const parts = String(section).slice(7).split(":");
  const cid = parts[0];
  const lid = parts[1];
  const c = (courses || []).find((x) => x.id === cid);
  const lessons = Array.isArray(c?.lessons) ? c.lessons.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
  const idx = lessons.findIndex((x, i) => String(x.id || i) === String(lid));
  const l = idx >= 0 ? lessons[idx] : null;
  const [navOpen, setNavOpen] = useState(false);
  const [ttsHide, setTtsHide] = useState(false);
  const [fontStep, setFontStep] = useState(loadFontStep);

  useEffect(() => {
    let prev = 0;
    const onScroll = () => {
      const y = window.scrollY || 0;
      if (y > prev + 8) setTtsHide(true);
      else if (y < prev - 8) setTtsHide(false);
      prev = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function toEmbed(url) {
    const u = String(url || "").trim();
    if (!u) return "";
    let m = u.match(/youtu\.be\/([\w-]{6,})/i);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    m = u.match(/[?&]v=([\w-]{6,})/i);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    if (/youtube\.com\/embed\//i.test(u)) return u;
    m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
    if (m) return "https://player.vimeo.com/video/" + m[1];
    return u;
  }

  if (!l) {
    return html`<div>
      <${PageHead} title="Lesson" onBack=${() => setSection("course:" + cid)} backLabel="Module" />
      <${Empty} title="Not found" body="This lesson is unavailable." />
    </div>`;
  }

  const unlocked = idx === 0 || loadProgress(student?.email, cid).completed.includes(String(lessons[idx - 1].id || (idx - 1)));
  if (!unlocked) {
    return html`<div>
      <${PageHead} title=${l.title} onBack=${() => setSection("course:" + cid + ":lessons")} backLabel="Lessons" />
      <${Empty} title="Locked" body="Finish the previous lesson before opening this one." />
    </div>`;
  }

  function completeAndNext() {
    const checks = Array.isArray(l.checkQuestions) ? l.checkQuestions.filter((q) => q.prompt) : [];
    if (checks.length) {
      setSection("lcheck:" + cid + ":" + (l.id != null ? l.id : idx));
      return;
    }
    markLessonDone(student?.email, cid, l.id != null ? l.id : idx);
    if (idx + 1 < lessons.length) {
      setSection("lesson:" + cid + ":" + (lessons[idx + 1].id != null ? lessons[idx + 1].id : (idx + 1)));
    } else {
      setSection("course:" + cid + ":lessons");
    }
  }

  const speakText = l.ttsText || l.body || "";
  return html`<div>
    <${PageHead} title=${l.title || "Lesson"} sub=${(l.type || "text") + " · " + (idx + 1) + " of " + lessons.length} onBack=${() => setSection("course:" + cid + ":lessons")} backLabel="Lessons" />
    <div class="lesson-scroll">
      <div class="lesson-fade-top"></div>
      <div class="panel prose">
        <div class="lesson-toolbar">
          <div class="font-ctrl">
            <button type="button" aria-label="Smaller text" onClick=${() => {
              const n = Math.max(0, fontStep - 1);
              setFontStep(n); saveFontStep(n);
            }}>A−</button>
            <span>${FONT_STEPS[fontStep].toUpperCase()}</span>
            <button type="button" aria-label="Larger text" onClick=${() => {
              const n = Math.min(FONT_STEPS.length - 1, fontStep + 1);
              setFontStep(n); saveFontStep(n);
            }}>A+</button>
          </div>
        </div>
        ${l.type === "video" && l.videoUrl
          ? html`<div class="video-wrap">
              <iframe
                src=${toEmbed(l.videoUrl)}
                title=${l.title || "Video"}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
                allowfullscreen
                referrerpolicy="strict-origin-when-cross-origin"
                loading="lazy"
              ></iframe>
            </div>`
          : null}
        <div class="lesson-body-wrap">
          ${l.body
            ? html`<div class=${"lesson-body fs-" + FONT_STEPS[fontStep]}>${l.body}</div>`
            : html`<p class="muted">No reading text for this lesson yet.</p>`}
          <div class="lesson-fade-bottom"></div>
        </div>
      </div>
    </div>
    ${speakText ? html`<${LessonTtsPlayer} text=${speakText} title=${l.title || "Lesson"} />` : null}
    <div style=${{ padding: "16px 0 100px" }}>
      <button type="button" class="btn-block" onClick=${completeAndNext}>
        ${(Array.isArray(l.checkQuestions) && l.checkQuestions.filter((q) => q.prompt).length)
          ? "Take quick check"
          : (idx + 1 < lessons.length ? "Mark done · Next lesson" : "Mark done · Finish module")}
      </button>
    </div>
    <button type="button" class="fab-lessons" aria-label="Lesson map" onClick=${() => setNavOpen(true)}>
      ${Icon({ name: "grid", size: 22 })}
    </button>
    ${navOpen ? html`<${LessonRingNav}
      lessons=${lessons}
      prog=${loadProgress(student?.email, cid)}
      cid=${cid}
      currentId=${l.id != null ? l.id : idx}
      onClose=${() => setNavOpen(false)}
      onPick=${(id) => { setNavOpen(false); setSection("lesson:" + cid + ":" + id); }}
    />` : null}
  </div>`;
}



function Tile({ s, onClick }) {
  return html`<div role=${onClick ? "button" : undefined} class=${"m-tile " + (TILE_TONE[s.id] || "sky") + (s.tall ? " tall" : "") + (onClick ? " is-click" : "")}
    onClick=${onClick}>
    <span class="tile-icon">${Icon({ name: s.icon || "grid", size: 20 })}</span>
    <div>
      <div class="num">${s.value}${s.total != null ? html`<span>/${s.total}</span>` : null}</div>
      <div class="lbl">${s.label}</div>
    </div>
  </div>`;
}


function TakeTest({ assessment, questions, onBack }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [left, setLeft] = useState((assessment?.timerMinutes || 0) * 60);
  const [done, setDone] = useState(false);
  const [warn, setWarn] = useState("");
  const anti = assessment?.antiCheat !== false;

  useEffect(() => {
    if (!assessment?.timerMinutes || done) return;
    const t = setInterval(() => {
      setLeft((s) => {
        if (s <= 1) { clearInterval(t); setDone(true); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [assessment?.timerMinutes, done]);

  useEffect(() => {
    if (!anti) return;
    const onVis = () => {
      if (document.hidden) setWarn("Stay on this screen until you finish. Leaving the tab is recorded.");
    };
    const block = (e) => { e.preventDefault(); setWarn("Copying is turned off for this test."); };
    document.addEventListener("visibilitychange", onVis);
    document.addEventListener("copy", block);
    document.addEventListener("cut", block);
    document.addEventListener("contextmenu", block);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      document.removeEventListener("copy", block);
      document.removeEventListener("cut", block);
      document.removeEventListener("contextmenu", block);
    };
  }, [anti]);

  if (!assessment) {
    return html`<div>
      <${PageHead} title="Test" onBack=${onBack} backLabel="Exit" />
      <${Empty} title="Not found" body="This test is no longer available." />
    </div>`;
  }
  if (done || (questions.length && idx >= questions.length)) {
    let score = 0;
    questions.forEach((q, i) => {
      if (q.correct != null && String(answers[i]) === String(q.correct)) score += 1;
    });
    return html`<div>
      <${PageHead} title="Submitted" sub=${assessment.title} onBack=${onBack} backLabel="Exit" />
      <div class="quiz-result-card ok">
        <div class="emoji">✓</div>
        <h3>Answers sent</h3>
        <p>You answered ${Object.keys(answers).length} of ${questions.length} questions.
        ${questions.some((q) => q.correct != null) ? " Score: " + score + " / " + questions.length + "." : " Your instructor will mark this."}</p>
        <div class="btn-row"><button type="button" class="btn-block" onClick=${onBack}>Back to tests</button></div>
      </div>
    </div>`;
  }
  const q = questions[idx] || null;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return html`<div class="test-shell quiz-shell" onCopy=${anti ? (e) => e.preventDefault() : undefined}>
    <${PageHead}
      title=${assessment.title}
      sub=${(assessment.timerMinutes ? ("Time left " + mm + ":" + ss) : "No time limit") + " · Q " + (questions.length ? idx + 1 : 0) + "/" + questions.length}
      onBack=${onBack}
      backLabel="Exit" />
    ${warn ? html`<p class="warn-banner">${warn}</p>` : null}
    ${!questions.length
      ? html`<div class="panel"><p>${assessment.description || "No questions published yet. Check back later."}</p>
          <div class="btn-row"><button type="button" class="btn-block" onClick=${onBack}>Back to tests</button></div></div>`
      : html`<div class="quiz-card">
          <h3>${q.prompt || q.text || "Question"}</h3>
          ${(q.options || []).map((opt, oi) => html`<label class=${"quiz-opt" + (String(answers[idx]) === String(oi) ? " on" : "")} key=${oi}>
            <input type="radio" name=${"q" + idx} checked=${String(answers[idx]) === String(oi)}
              onChange=${() => setAnswers({ ...answers, [idx]: oi })} />
            <span>${opt}</span>
          </label>`)}
          <div class="btn-row">
            <button type="button" class="btn-block" onClick=${() => {
              if (idx + 1 >= questions.length) setDone(true);
              else setIdx(idx + 1);
            }}>${idx + 1 >= questions.length ? "Submit answers" : "Next question"}</button>
            ${idx > 0 ? html`<button type="button" class="btn-block secondary" onClick=${() => setIdx(idx - 1)}>Previous</button>` : null}
          </div>
        </div>`}
  </div>`;
}


function toEmbed(url) {
  const u = String(url || "").trim();
  if (!u) return "";
  let m = u.match(/youtu\.be\/([\w-]{6,})/i);
  if (m) return "https://www.youtube.com/embed/" + m[1];
  m = u.match(/[?&]v=([\w-]{6,})/i);
  if (m) return "https://www.youtube.com/embed/" + m[1];
  m = u.match(/youtube\.com\/embed\/([\w-]{6,})/i);
  if (m) return u;
  m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/i);
  if (m) return "https://player.vimeo.com/video/" + m[1];
  return u;
}

function ListCard({ badge, title, note, tone, onClick, shaking, locked }) {
  return html`<article class=${"m-card" + (onClick ? " is-click" : "") + (shaking ? " shake" : "") + (locked ? " is-locked" : "")} role=${onClick ? "button" : undefined} onClick=${onClick}>
    <span class=${"badge tone-" + (tone || "mist")}>${badge}</span>
    <div class="m-card-text">
      <h4>${title}</h4>
      <p class=${locked && shaking ? "lock-note-hot" : ""}>${note || ""}</p>
    </div>
    ${locked ? html`<span class="lock-pill" aria-hidden="true">🔒</span>` : null}
  </article>`;
}

function LessonList({ lessons, prog, cid, setSection }) {
  const [shakeId, setShakeId] = useState(null);
  const [warn, setWarn] = useState("");
  if (!lessons.length) {
    return html`<${Empty} title="No lessons yet" body="Your instructor will add videos and reading here." />`;
  }
  return html`<div class="m-list">
    ${lessons.map((l, i) => {
      const id = String(l.id != null ? l.id : i);
      const unlocked = i === 0 || prog.completed.includes(String(lessons[i - 1].id != null ? lessons[i - 1].id : (i - 1)));
      const done = prog.completed.includes(id);
      const num = String(i + 1).padStart(2, "0");
      const tone = done ? "done" : (!unlocked ? "lock" : (l.type === "video" ? "coral" : "sky"));
      const lockedHere = !unlocked && shakeId === id;
      const note = !unlocked
        ? (lockedHere ? ("Locked · finish “" + (lessons[i - 1]?.title || "previous") + "” first") : "Locked")
        : ((l.type || "text") + (l.duration ? " · " + l.duration : "") + (done ? " · Completed" : ""));
      return html`<${ListCard} key=${id}
        badge=${num}
        title=${l.title || "Lesson"}
        note=${note}
        tone=${tone}
        shaking=${shakeId === id}
        locked=${!unlocked}
        onClick=${() => {
          if (unlocked) {
            setShakeId(null);
            setSection("lesson:" + cid + ":" + id);
          } else {
            setShakeId(id);
            setTimeout(() => setShakeId(null), 900);
          }
        }} />`;
    })}
  </div>`;
}


function MessagesScreen({ messages, student, setSection }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [local, setLocal] = useState(messages || []);

  useEffect(() => { setLocal(messages || []); }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) {
      setNote("Add a subject and message.");
      return;
    }
    setBusy(true);
    setNote("");
    try {
      const { getFirebase } = await import("../../services/firebase.service.js");
      const { db, api } = await getFirebase();
      const ref = await api.addDoc(api.collection(db, "supportMessages"), {
        email: (student?.email || "").toLowerCase(),
        studentId: student?.id || "",
        name: student?.name || "",
        subject: subject.trim(),
        body: body.trim(),
        status: "open",
        createdAt: api.serverTimestamp()
      });
      setLocal([{ id: ref.id, subject: subject.trim(), body: body.trim(), status: "open", createdAt: { toDate: () => new Date() } }, ...local]);
      setSubject("");
      setBody("");
      setNote("Message sent. The academy will reply here when they can.");
    } catch (err) {
      setNote(err.message || "Could not send. Try again later.");
    } finally {
      setBusy(false);
    }
  }

  return html`<div>
    <${PageHead} title="Messages" sub="Support with the academy" onBack=${() => setSection("dashboard")} backLabel="Home" />
    <form class="panel" onSubmit=${send} style=${{ marginBottom: 14 }}>
      <label class="cred-label">Subject</label>
      <input style=${{ width: "100%", marginBottom: 8, boxSizing: "border-box" }} value=${subject} onInput=${(e) => setSubject(e.target.value)} placeholder="e.g. Fee receipt question" />
      <label class="cred-label">Message</label>
      <textarea rows="4" style=${{ width: "100%", marginBottom: 10, boxSizing: "border-box" }} value=${body} onInput=${(e) => setBody(e.target.value)} placeholder="Write your message…"></textarea>
      ${note ? html`<p style=${{ fontSize: 13, marginBottom: 8, color: "var(--muted)" }}>${note}</p>` : null}
      <button type="submit" class="btn-block" disabled=${busy}>${busy ? "Sending…" : "Send to academy"}</button>
    </form>
    <div class="m-section-h"><h3 class="display">Your messages</h3></div>
    <div class="m-list">
      ${local.length
        ? local.map((m) => html`<article class="m-card" key=${m.id}>
            <span class="badge tone-mist">${(m.status || "open").toString().slice(0, 4)}</span>
            <div class="m-card-text">
              <h4>${m.subject || "Message"}</h4>
              <p>${(m.body || "").slice(0, 100)}${(m.body || "").length > 100 ? "…" : ""}</p>
              ${m.reply ? html`<p style=${{ marginTop: 6, color: "var(--ink)" }}><strong>Reply:</strong> ${m.reply}</p>` : null}
            </div>
          </article>`)
        : html`<${Empty} title="No messages yet" body="Send a note above if you need help with fees, classes, or your profile." />`}
    </div>
  </div>`;
}

function SettingsScreen({ student, user, onLogout, setSection }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(() => {
    try { return localStorage.getItem("cgtia_notify") !== "0"; } catch (_) { return true; }
  });
  const [dark, setDark] = useState(() => {
    try { return localStorage.getItem("cgtia_theme") === "dark"; } catch (_) { return false; }
  });

  function toggleNotify() {
    const next = !notify;
    setNotify(next);
    try { localStorage.setItem("cgtia_notify", next ? "1" : "0"); } catch (_) {}
  }
  function toggleDark() {
    const next = !dark;
    setDark(next);
    try {
      localStorage.setItem("cgtia_theme", next ? "dark" : "light");
      document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    } catch (_) {}
  }
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    } catch (_) {}
  }, [dark]);

  async function changePassword(e) {
    e.preventDefault();
    setMsg("");
    if (pw1.length < 6) { setMsg("Use at least 6 characters."); return; }
    if (pw1 !== pw2) { setMsg("Passwords do not match."); return; }
    setBusy(true);
    try {
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
      const auth = authMod.getAuth(app);
      const u = auth.currentUser || user;
      if (!u) throw new Error("Please sign in again.");
      await authMod.updatePassword(u, pw1);
      setPw1(""); setPw2("");
      setMsg("Password updated.");
    } catch (err) {
      const code = err && err.code;
      if (code === "auth/requires-recent-login") {
        setMsg("For security, sign out and sign in again, then change your password.");
      } else {
        setMsg(err.message || "Could not update password.");
      }
    } finally {
      setBusy(false);
    }
  }

  return html`<div>
    <${PageHead} title="Settings" sub="Account & preferences" onBack=${() => setSection("dashboard")} backLabel="Home" />
    <div class="panel" style=${{ marginBottom: 12 }}>
      <div class="cred-label">Signed in as</div>
      <strong>${student?.email || "—"}</strong>
    </div>
    <div class="panel" style=${{ marginBottom: 12 }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style=${{ fontSize: 14 }}>Dashboard notices</strong>
          <p style=${{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>Offers & notices on home</p>
        </div>
        <button type="button" class=${"toggle-mini" + (notify ? " on" : "")} onClick=${toggleNotify} aria-label="Toggle notices">${notify ? "On" : "Off"}</button>
      </div>
    </div>
    <div class="panel" style=${{ marginBottom: 12 }}>
      <div style=${{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <strong style=${{ fontSize: 14 }}>Night mode</strong>
          <p style=${{ fontSize: 12, color: "var(--muted)", margin: "4px 0 0" }}>Darker colours for low light</p>
        </div>
        <button type="button" class=${"toggle-mini" + (dark ? " on" : "")} onClick=${toggleDark} aria-label="Toggle night mode">
          ${Icon({ name: dark ? "moon" : "sun", size: 16 })} ${dark ? "On" : "Off"}
        </button>
      </div>
    </div>
    <form class="panel" onSubmit=${changePassword}>
      <strong style=${{ fontSize: 14, display: "block", marginBottom: 10 }}>Change password</strong>
      <input type="password" autocomplete="new-password" placeholder="New password" value=${pw1} onInput=${(e) => setPw1(e.target.value)}
        style=${{ width: "100%", marginBottom: 8, boxSizing: "border-box" }} />
      <input type="password" autocomplete="new-password" placeholder="Confirm password" value=${pw2} onInput=${(e) => setPw2(e.target.value)}
        style=${{ width: "100%", marginBottom: 10, boxSizing: "border-box" }} />
      ${msg ? html`<p style=${{ fontSize: 13, marginBottom: 8, color: "var(--muted)" }}>${msg}</p>` : null}
      <button type="submit" class="btn-block" disabled=${busy}>${busy ? "Saving…" : "Update password"}</button>
    </form>
    <div style=${{ marginTop: 16 }}>
      <button type="button" class="btn-block secondary" onClick=${onLogout}>Sign out</button>
    </div>
  </div>`;
}



function NotifDrawer({ open, onClose, items, onOpen }) {
  return html`<div class=${"notif-drawer" + (open ? " open" : "")}>
    <div class="notif-scrim" onClick=${onClose}></div>
    <aside class="notif-panel" role="dialog" aria-label="Notifications">
      <div class="notif-head">
        <strong style=${{ fontSize: 16 }}>Notifications</strong>
        <button type="button" class="icon-btn" aria-label="Close" onClick=${onClose}>${Icon({ name: "close", size: 18 })}</button>
      </div>
      <div class="notif-list">
        ${(items || []).length
          ? (items || []).map((n) => html`<article class=${"notif-item" + (n.read ? "" : " unread")} key=${n.id}
              role=${n.linkUrl || n.section ? "button" : undefined}
              onClick=${() => onOpen && onOpen(n)}>
              <h4>${n.title || "Notice"}</h4>
              <p>${n.body || n.message || ""}</p>
              <time>${n.createdAt?.toDate ? n.createdAt.toDate().toLocaleString() : ""}</time>
            </article>`)
          : html`<${Empty} title="You're all caught up" body="When the academy posts a notice for you, it will show here." />`}
      </div>
    </aside>
  </div>`;
}

export function MobileView({ ctx }) {

  const {
    student, nav, section, setSection, stats, courses, grades, payments,
    paidTotal, onLogout, linked, announcements, promos, assessments,
    certificates, attendance, schedule, messages, notifications, user
  } = ctx;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const name = student?.name || "Student";
  const first = String(name).split(/\s+/)[0];
  const unreadNotifs = (notifications || []).filter((n) => !n.read).length;

  let body = null;
  if (section === "dashboard") {
    body = html`
      <section class="m-hello">
        <p class="sm">Hello</p>
        <h1 class="display">${first}</h1>
      </section>
      <section class="m-banner">
        <div class="m-banner-copy">
          <h2 class="display">${linked ? "Your dashboard" : "Link your file"}</h2>
          <p>${linked
            ? "Courses and results update when the academy publishes them."
            : "Ask admissions to match this email to your student record."}</p>
          <button type="button" class="pill-ink" onClick=${() => setSection(linked ? "courses" : "profile")}>
            ${linked ? "Courses" : "Profile"}
          </button>
        </div>
        <${ImageSlot} asset=${ASSETS.bannerPerson} className="m-banner-img" />
      </section>
      ${(promos || []).length ? html`<section class="dash-promo-strip">
        <div class="m-section-h"><h3 class="display">Offers</h3></div>
        <div class="promo-scroll">
          ${(promos || []).map((p) => html`<article class="promo-chip" key=${p.id}
            role=${p.linkUrl ? "button" : undefined}
            onClick=${p.linkUrl ? () => { try { window.open(p.linkUrl, "_blank", "noopener"); } catch (_) {} } : undefined}>
            ${p.badge ? html`<span class="promo-badge">${p.badge}</span>` : null}
            <strong>${p.title}</strong>
            <p>${(p.body || "").slice(0, 80)}${(p.body || "").length > 80 ? "…" : ""}</p>
            ${p.linkUrl ? html`<span class="promo-cta">${p.linkLabel || "View"}</span>` : null}
          </article>`)}
        </div>
      </section>` : null}
      ${(announcements || []).length ? html`<section>
        <div class="m-section-h"><h3 class="display">Notices</h3></div>
        <div class="m-list">
          ${(announcements || []).slice(0, 4).map((a) => html`<article class="notice-row is-click" key=${a.id}
            role="button" onClick=${() => setSection("notice:" + a.id)}>
            <div class="notice-ico">${a.linkUrl ? "↗" : "●"}</div>
            <div class="notice-mid">
              <h4>${a.title || "Notice"}</h4>
              <p>${(a.body || "").slice(0, 90)}${(a.body || "").length > 90 ? "…" : ""}</p>
            </div>
            <span class="notice-chev">›</span>
          </article>`)}
        </div>
      </section>` : null}
      <section class="m-tiles">
        ${stats.map((s) => html`<${Tile} key=${s.id} s=${s} onClick=${() => {
          if (s.id === "courses" || s.go === "courses") setSection("courses");
          else if (s.id === "grades" || s.go === "grades") setSection("grades");
          else if (s.id === "fees" || s.go === "fees") setSection("fees");
          else if (s.go) setSection(s.go);
        }} />`)}
      </section>
      <section>
        <div class="m-section-h"><h3 class="display">More</h3></div>
        <div class="more-grid">
          ${[
            { id: "schedule", label: "Schedule", icon: "cal" },
            { id: "attendance", label: "Attendance", icon: "check" },
            { id: "certificates", label: "Certificates", icon: "card" },
            { id: "messages", label: "Messages", icon: "mail" },
            { id: "transcript", label: "Transcript", icon: "chart" },
            { id: "settings", label: "Settings", icon: "gear" }
          ].map((x) => html`<button type="button" class="more-tile" key=${x.id} onClick=${() => setSection(x.id)}>
            <span class="tile-icon">${Icon({ name: x.icon, size: 18 })}</span>
            <span>${x.label}</span>
          </button>`)}
        </div>
      </section>
      <section>
        <div class="m-section-h">
          <h3 class="display">Modules</h3>
          ${courses.length ? html`<button type="button" class="see" style=${{ border: 0, background: "none" }} onClick=${() => setSection("courses")}>See all</button>` : null}
        </div>
        <div class="m-list">
          ${courses.length
            ? courses.slice(0, 3).map((c, i) => html`<${ListCard} key=${c.id}
                badge=${String(i + 1).padStart(2, "0")}
                title=${c.title || c.code}
                note=${c.code || "Tap to open"}
                tone=${i % 2 ? "mist" : "ink"}
                onClick=${() => setSection("course:" + c.id)} />`)
            : html`<${Empty} title="No modules yet" body="They will show here once your programme is on file." />`}
        </div>
      </section>
      <section>
        <div class="m-section-h">
          <h3 class="display">Results</h3>
          ${grades.length ? html`<button type="button" class="see" style=${{ border: 0, background: "none" }} onClick=${() => setSection("grades")}>See all</button>` : null}
        </div>
        <div class="m-list">
          ${grades.length
            ? grades.slice(0, 3).map((g) => html`<${ListCard} key=${g.id}
                badge=${g.grade || "·"}
                title=${g.courseTitle || g.courseCode || "Course"}
                note=${g.score != null ? "Score " + g.score : "Published"}
                tone="lime" />`)
            : html`<${Empty} title="No results yet" body="Published grades will land here. Nothing else to do on your side." />`}
        </div>
      </section>
    `;
  } else if (section === "courses") {
    body = html`
      <div class="page-head"><h1 class="display">Courses</h1><p>Your programme modules</p></div>
      <div class="m-list">
        ${courses.length
          ? courses.map((c, i) => html`<${ListCard} key=${c.id}
              badge=${String(i + 1).padStart(2, "0")}
              title=${c.title || c.code}
              note=${c.code || "Tap to open"}
              tone=${i % 2 ? "mist" : "ink"}
              onClick=${() => setSection("course:" + c.id)} />`)
          : html`<${Empty} title="Nothing to show yet" body="Your course list appears after admissions links your programme." />`}
      </div>
    `;
  } else if (section === "grades") {
    body = html`
      <${PageHead} title="My grades" sub="Published results only" onBack=${() => setSection("dashboard")} backLabel="Home" />
      ${grades.length ? html`<div style=${{ marginBottom: 12 }}>
        <button type="button" class="btn-block secondary" onClick=${() => setSection("transcript")}>Open full transcript</button>
      </div>` : null}
      <div class="m-list">
        ${grades.length
          ? grades.map((g) => html`<${ListCard} key=${g.id}
              badge=${g.grade || "·"}
              title=${g.courseTitle || g.courseCode || "Course"}
              note=${g.score != null ? "Score " + g.score : (g.remark || "Tap for details")}
              tone="lime"
              onClick=${() => setSection("grade:" + g.id)} />`)
          : html`<${Empty} title="No grades published" body="Instructors release results when they are ready. Check back after assessments." />`}
      </div>
    `;
  } else if (section === "assessments") {
    body = html`
      <div class="page-head"><h1 class="display">Tests & assignments</h1><p>Live for your programme</p></div>
      <div class="m-list">
        ${(assessments || []).length
          ? assessments.map((a) => html`<${ListCard} key=${a.id}
              badge=${(a.type || "test").slice(0, 1).toUpperCase()}
              title=${a.title}
              note=${(a.dueDate ? "Due " + a.dueDate : "No due date") + (a.timerMinutes ? " · " + a.timerMinutes + " min" : "") + (a.moduleCode ? " · " + a.moduleCode : "")}
              tone=${a.type === "exam" ? "coral" : a.type === "assignment" ? "lime" : "ink"}
              onClick=${() => setSection("test:" + a.id)} />`)
          : html`<${Empty} title="Nothing scheduled" body="When tests or assignments go live for your track, they will appear here." />`}
      </div>
    `;
  } else if (section === "fees") {
    // Home: balance + shortcuts + recent 5
    const recent = (payments || []).slice(0, 5);
    body = html`
      <${PageHead} title="Fees" sub="Your academy payments" />
      <div class="fees-balance">
        <div class="lbl">TOTAL RECORDED</div>
        <div class="big">${money(paidTotal)}</div>
        <div class="meta">${payments.length} payment${payments.length === 1 ? "" : "s"} on this email</div>
      </div>
      <div class="fees-actions">
        <button type="button" class="fees-action" onClick=${() => setSection("fees:tx")}>
          <strong>All transactions</strong>
          <span>Full history & filters</span>
        </button>
        <button type="button" class="fees-action" onClick=${() => setSection("fees:tx:paid")}>
          <strong>Paid only</strong>
          <span>Successful payments</span>
        </button>
      </div>
      <div class="panel">
        <div class="m-section-h" style=${{ marginBottom: 4 }}>
          <h3 class="display" style=${{ fontSize: 15 }}>Recent</h3>
        </div>
        ${recent.length
          ? recent.map((p) => {
              const st = String(p.paymentStatus || p.status || "paid").toLowerCase();
              const stClass = /pend|partial/.test(st) ? "is-pend" : /fail|cancel|unpaid/.test(st) ? "is-fail" : "";
              return html`<div class="tx-row" key=${p.id} role="button" onClick=${() => setSection("receipt:" + p.id)}>
                <div class="tx-ico">${Icon({ name: "card", size: 18 })}</div>
                <div class="tx-mid">
                  <h4>${p.feeName || p.purpose || p.feeType || p.program || "Payment"}</h4>
                  <p>${formatPayDate(p.paidAt || p.createdAt)}</p>
                </div>
                <div class="tx-right">
                  <div class="amt">${money(p.amountPaid || p.amount)}</div>
                  <div class=${"st " + stClass}>${st}</div>
                </div>
              </div>`;
            })
          : html`<${Empty} title="No payments yet" body="When you pay with a fee link, it will show up here." />`}
        ${payments.length > 5
          ? html`<div class="see-all-row"><button type="button" onClick=${() => setSection("fees:tx")}>See all transactions</button></div>`
          : (payments.length > 0
              ? html`<div class="see-all-row"><button type="button" onClick=${() => setSection("fees:tx")}>View all transactions</button></div>`
              : null)}
      </div>
    `;
  } else if (String(section || "").startsWith("fees:")) {
    const parts = String(section).slice(5).split(":");
    const feeFilter = parts[1] || parts[0] || "all";
    // fees:tx or fees:tx:paid or fees:all
    const filter = feeFilter === "tx" ? "all" : feeFilter;
    const filters = [
      { id: "all", label: "All" },
      { id: "paid", label: "Paid" },
      { id: "pending", label: "Pending" },
      { id: "failed", label: "Failed" },
      { id: "tuition", label: "Tuition" },
      { id: "id-card", label: "ID card" }
    ];
    const filtered = (payments || []).filter((p) => {
      const st = String(p.paymentStatus || p.status || "").toLowerCase();
      const blob = [p.feeName, p.feeType, p.purpose, p.program].map((x) => String(x || "").toLowerCase()).join(" ");
      if (filter === "all") return true;
      if (filter === "paid") return /paid|complete/.test(st);
      if (filter === "pending") return /pend|partial/.test(st);
      if (filter === "failed") return /fail|unpaid|cancel/.test(st);
      if (filter === "tuition") return /tuition|cert|diploma|program/.test(blob);
      if (filter === "id-card") return /id.?card|student id/.test(blob);
      return true;
    });
    body = html`
      <${PageHead} title="Transactions" sub="Tap a row for the full receipt" onBack=${() => setSection("fees")} backLabel="Fees" />
      <div class="filter-chips">
        ${filters.map((f) => html`<button type="button" key=${f.id} class=${filter === f.id ? "on" : ""}
          onClick=${() => setSection("fees:tx:" + f.id)}>${f.label}</button>`)}
      </div>
      <div class="panel">
        ${filtered.length
          ? filtered.map((p) => {
              const st = String(p.paymentStatus || p.status || "paid").toLowerCase();
              const stClass = /pend|partial/.test(st) ? "is-pend" : /fail|cancel|unpaid/.test(st) ? "is-fail" : "";
              return html`<div class="tx-row" key=${p.id} role="button" onClick=${() => setSection("receipt:" + p.id)}>
                <div class="tx-ico">${Icon({ name: "card", size: 18 })}</div>
                <div class="tx-mid">
                  <h4>${p.feeName || p.purpose || p.feeType || p.program || "Payment"}</h4>
                  <p>${formatPayDate(p.paidAt || p.createdAt)}${p.method || p.channel ? " · " + (p.method || p.channel) : ""}</p>
                </div>
                <div class="tx-right">
                  <div class="amt">${money(p.amountPaid || p.amount)}</div>
                  <div class=${"st " + stClass}>${st}</div>
                </div>
              </div>`;
            })
          : html`<${Empty} title="Nothing in this filter" body="Try All, or pay with a fee link from the academy." />`}
      </div>
    `;
  } else if (String(section || "").startsWith("receipt:")) {
    const rid = String(section).slice(8);
    const pmt = (payments || []).find((x) => x.id === rid);
    body = html`
      <${PageHead} title="Receipt" sub="Payment details" onBack=${() => setSection("fees:tx")} backLabel="Transactions" />
      ${!pmt ? html`<${Empty} title="Not found" body="This payment is no longer available." />` : html`
        <div class="receipt-sheet">
          <div class="receipt-hero">
            <div class="sub">CGTIA</div>
            <div class="amt">${money(pmt.amountPaid || pmt.amount)}</div>
            <div class="sub">${pmt.feeName || pmt.purpose || pmt.feeType || "Payment"}</div>
            <div class="sub" style=${{ marginTop: 6 }}>${String(pmt.paymentStatus || pmt.status || "paid").toUpperCase()}</div>
          </div>
          <div class="panel">
            <div class="receipt-row"><span>Status</span><span>${pmt.paymentStatus || pmt.status || "—"}</span></div>
            <div class="receipt-row"><span>Date</span><span>${formatPayDate(pmt.paidAt || pmt.createdAt)}</span></div>
            <div class="receipt-row"><span>Method</span><span>${pmt.method || pmt.channel || "—"}</span></div>
            <div class="receipt-row"><span>Reference</span><span>${pmt.reference || pmt.paystackReference || pmt.id}</span></div>
            <div class="receipt-row"><span>Email</span><span>${pmt.email || student?.email || "—"}</span></div>
            <div class="receipt-row"><span>Name</span><span>${pmt.fullName || student?.name || "—"}</span></div>
            ${pmt.regNumber ? html`<div class="receipt-row"><span>Reg number</span><span>${pmt.regNumber}</span></div>` : null}
            ${pmt.program || pmt.programName ? html`<div class="receipt-row"><span>Programme</span><span>${pmt.programName || pmt.program}</span></div>` : null}
          </div>
        </div>
      `}
    `;
  } else if (String(section || "").startsWith("notice:")) {
    const nid = String(section).slice(7);
    const n = (announcements || []).find((a) => String(a.id) === nid) || (announcements || [])[0];
    body = html`
      <${PageHead} title=${n?.title || "Notice"} sub="From the academy" onBack=${() => setSection("dashboard")} backLabel="Home" />
      <div class="panel prose"><p>${n?.body || n?.message || "No further details."}</p>
        ${n?.linkUrl ? html`<div style=${{ marginTop: 16 }}>
          <button type="button" class="btn-block" onClick=${() => { try { window.open(n.linkUrl, "_blank", "noopener"); } catch (_) {} }}>
            ${n.linkLabel || "Open link"}
          </button>
        </div>` : null}
      </div>
    `;
  } else if (String(section || "").startsWith("course:")) {
    const rest = String(section).slice(7);
    const bits = rest.split(":");
    const cid = bits[0];
    const mode = bits[1] || "intro";
    const c = (courses || []).find((x) => x.id === cid);
    const lessons = Array.isArray(c?.lessons) ? c.lessons.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const prog = loadProgress(student?.email, cid);
    const doneN = lessons.filter((l, i) => prog.completed.includes(String(l.id != null ? l.id : i))).length;
    const pct = lessons.length ? Math.round((doneN / lessons.length) * 100) : 0;
    const resumeId = prog.lastLessonId;
    const resumeIdx = lessons.findIndex((l, i) => String(l.id != null ? l.id : i) === String(resumeId));
    const nextIdx = resumeIdx >= 0 ? resumeIdx : (doneN < lessons.length ? doneN : 0);

    if (mode !== "lessons") {
      body = html`
        <${PageHead} title=${c?.title || "Module"} sub=${(c?.code || "") + (c?.program ? " · " + c.program : "")} onBack=${() => setSection("courses")} backLabel="Courses" />
        <div class="course-hero-art">
          ${c?.coverUrl
            ? html`<img src=${c.coverUrl} alt="" />`
            : html`<div class="ph"><strong>${c?.title || "Module"}</strong><br/>${lessons.length} lesson${lessons.length === 1 ? "" : "s"} ready<br/><span style=${{ fontSize: 11 }}>Add a cover .webp in admin</span></div>`}
        </div>
        <div class="panel">
          <div class="prog-label">${doneN} of ${lessons.length} lessons done · ${pct}%</div>
          <div class="prog-bar"><i style=${{ width: pct + "%" }}></i></div>
          <p style=${{ marginTop: 12, fontSize: 14, lineHeight: 1.55, color: "#334155" }}>${c?.description || "No description yet."}</p>
          <div class="module-cta-stack">
            <button type="button" class="btn-block" onClick=${() => setSection("course:" + cid + ":lessons")}>
              ${doneN > 0 ? "Continue learning" : "Start lessons"}
            </button>
            ${resumeId && lessons[nextIdx]
              ? html`<button type="button" class="icon-back-btn" style=${{ justifyContent: "center" }}
                  onClick=${() => setSection("lesson:" + cid + ":" + (lessons[nextIdx].id != null ? lessons[nextIdx].id : nextIdx))}>
                  Resume: ${lessons[nextIdx].title || "last lesson"}
                </button>`
              : null}
            ${doneN >= lessons.length && lessons.length > 0 && !prog.modulePassed && (c?.moduleQuizQuestions || []).length
              ? html`<button type="button" class="btn-block" onClick=${() => setSection("mquiz:" + cid)}>
                  Take module quiz (${c.moduleQuizPassPercent || 90}% to pass)
                </button>`
              : null}
            ${prog.modulePassed
              ? html`<p style=${{ textAlign: "center", fontWeight: 700, marginTop: 4 }}>Module completed ✓</p>`
              : null}
          </div>
        </div>
      `;
    } else {
      body = html`
        <${PageHead} title="Lessons" sub=${(c?.title || "") + " · " + pct + "% complete"} onBack=${() => setSection("course:" + cid)} backLabel="Overview" />
        <div class="panel" style=${{ marginBottom: 12 }}>
          <div class="prog-bar"><i style=${{ width: pct + "%" }}></i></div>
          <div class="prog-label">${doneN}/${lessons.length} complete · open in order (no skipping)</div>
        </div>
        <${LessonList} lessons=${lessons} prog=${prog} cid=${cid} setSection=${setSection} />
        ${doneN >= lessons.length && lessons.length > 0 && !prog.modulePassed && (c?.moduleQuizQuestions || []).length
          ? html`<div style=${{ marginTop: 14 }}><button type="button" class="btn-block" onClick=${() => setSection("mquiz:" + cid)}>
              Take module quiz
            </button></div>`
          : null}
      `;
    }
  } else if (String(section || "").startsWith("lcheck:")) {
    const parts = String(section).slice(7).split(":");
    const cid = parts[0];
    const lid = parts[1];
    const c = (courses || []).find((x) => x.id === cid);
    const lessons = Array.isArray(c?.lessons) ? c.lessons.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const idx = lessons.findIndex((x, i) => String(x.id != null ? x.id : i) === String(lid));
    const l = idx >= 0 ? lessons[idx] : null;
    const qs = (l && Array.isArray(l.checkQuestions)) ? l.checkQuestions : [];
    body = html`<${MiniQuiz}
      title=${"Quick check"}
      subtitle=${l?.title || ""}
      questions=${qs}
      passPercent=${70}
      failHint=${"Skim the lesson again, then retry. You need about 70% to continue."}
      onBack=${() => setSection("lesson:" + cid + ":" + lid)}
      onPass=${() => {
        markLessonDone(student?.email, cid, l?.id != null ? l.id : idx);
        if (idx + 1 < lessons.length) {
          setSection("lesson:" + cid + ":" + (lessons[idx + 1].id != null ? lessons[idx + 1].id : (idx + 1)));
        } else {
          setSection("course:" + cid + ":lessons");
        }
      }}
    />`;
  } else if (String(section || "").startsWith("mquiz:")) {
    const cid = String(section).slice(6);
    const c = (courses || []).find((x) => x.id === cid);
    const qs = Array.isArray(c?.moduleQuizQuestions) ? c.moduleQuizQuestions : [];
    const pass = Number(c?.moduleQuizPassPercent) || 90;
    body = html`<${MiniQuiz}
      title=${"Module quiz"}
      subtitle=${c?.title || ""}
      questions=${qs}
      passPercent=${pass}
      failHint=${"Review the module lessons and try again. You need " + pass + "% to complete this module."}
      onBack=${() => setSection("course:" + cid)}
      onPass=${() => {
        setModulePassed(student?.email, cid, true);
        setSection("course:" + cid);
      }}
    />`;
  } else if (String(section || "").startsWith("lesson:")) {
    body = html`<${LessonView} section=${section} courses=${courses} student=${student} setSection=${setSection} />`;
  } else if (String(section || "").startsWith("test:")) {
    const tid = String(section).slice(5);
    const a = (assessments || []).find((x) => x.id === tid);
    const qs = Array.isArray(a?.questions) ? a.questions : [];
    body = html`<${TakeTest} assessment=${a} questions=${qs} onBack=${() => setSection("assessments")} />`;
  } else if (String(section || "").startsWith("grade:")) {
    const gid = String(section).slice(6);
    const g = (grades || []).find((x) => String(x.id) === gid);
    body = html`
      <${PageHead} title="Result detail" sub="Published grade" onBack=${() => setSection("grades")} backLabel="Grades" />
      ${!g ? html`<${Empty} title="Not found" body="This result is no longer available." />` : html`
        <div class="panel">
          <div class="cred-label">Module</div>
          <strong style=${{ fontSize: 18 }}>${g.courseTitle || g.courseCode || "Course"}</strong>
          <p style=${{ color: "var(--muted)", fontSize: 13, marginTop: 4 }}>${g.courseCode || ""}</p>
          <div style=${{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 16 }}>
            <div class="cred-card"><span class="cred-label">Grade</span><strong>${g.grade || "—"}</strong></div>
            <div class="cred-card"><span class="cred-label">Score</span><strong>${g.score != null ? g.score : "—"}</strong></div>
          </div>
          ${g.remark ? html`<div style=${{ marginTop: 14 }}><span class="cred-label">Remark</span><p style=${{ marginTop: 4, lineHeight: 1.5 }}>${g.remark}</p></div>` : null}
          ${g.term || g.session ? html`<p style=${{ marginTop: 12, fontSize: 13, color: "var(--muted)" }}>${g.term || g.session}</p>` : null}
          <p style=${{ marginTop: 16, fontSize: 12, color: "var(--muted)" }}>From your academy file · ${student?.reg || student?.email || ""}</p>
        </div>
        <div style=${{ marginTop: 12 }}>
          <button type="button" class="btn-block secondary" onClick=${() => setSection("transcript")}>Open full transcript</button>
        </div>
      `}
    `;
  } else if (section === "schedule") {
    const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const byDay = {};
    (schedule || []).forEach((s) => {
      const d = s.day || s.weekday || "Other";
      if (!byDay[d]) byDay[d] = [];
      byDay[d].push(s);
    });
    body = html`
      <${PageHead} title="Schedule" sub="Class times for your track" onBack=${() => setSection("dashboard")} backLabel="Home" />
      ${(schedule || []).length
        ? days.filter((d) => byDay[d]).concat(Object.keys(byDay).filter((d) => !days.includes(d))).map((d) => html`<section key=${d} style=${{ marginBottom: 14 }}>
            <div class="m-section-h"><h3 class="display" style=${{ fontSize: 15 }}>${d}</h3></div>
            <div class="m-list">
              ${byDay[d].map((s) => html`<article class="m-card" key=${s.id}>
                <span class="badge tone-sky">${(s.startTime || s.time || "—").toString().slice(0, 5)}</span>
                <div class="m-card-text">
                  <h4>${s.title || s.courseTitle || s.module || "Session"}</h4>
                  <p>${[s.endTime ? "until " + s.endTime : "", s.room || s.venue || "", s.tutor || s.instructor || ""].filter(Boolean).join(" · ") || "Class session"}</p>
                </div>
              </article>`)}
            </div>
          </section>`)
        : html`<${Empty} title="No timetable yet" body="When the academy publishes class times for your programme, they will show up here." />`}
    `;
  } else if (section === "attendance") {
    const rows = attendance || [];
    const present = rows.filter((r) => /present|yes|1|attended/i.test(String(r.status || r.present || ""))).length;
    const pct = rows.length ? Math.round((present / rows.length) * 100) : null;
    body = html`
      <${PageHead} title="Attendance" sub="Sessions marked by your instructors" onBack=${() => setSection("dashboard")} backLabel="Home" />
      ${rows.length ? html`<div class="panel" style=${{ marginBottom: 12 }}>
        <div class="prog-label">${present} present of ${rows.length} recorded · ${pct}%</div>
        <div class="prog-bar"><i style=${{ width: (pct || 0) + "%" }}></i></div>
      </div>` : null}
      <div class="m-list">
        ${rows.length
          ? rows.map((r) => {
              const st = String(r.status || (r.present ? "Present" : "Absent") || "—");
              const ok = /present|yes|attended/i.test(st);
              return html`<${ListCard} key=${r.id}
                badge=${ok ? "P" : "A"}
                title=${r.sessionTitle || r.topic || r.module || "Session"}
                note=${[r.date || r.sessionDate || "", st].filter(Boolean).join(" · ")}
                tone=${ok ? "lime" : "coral"} />`;
            })
          : html`<${Empty} title="No attendance yet" body="After classes are marked, your presence record will appear here." />`}
      </div>
    `;
  } else if (section === "certificates") {
    const certs = certificates || [];
    const idStatus = student?.idCardStatus || (certs.find((c) => c.idCardStatus) || {}).idCardStatus || "";
    body = html`
      <${PageHead} title="Certificates & ID" sub="Credentials on your academy file" onBack=${() => setSection("dashboard")} backLabel="Home" />
      <div class="cred-grid">
        <article class="cred-card">
          <span class="cred-label">Student ID card</span>
          <strong>${idStatus || (student?.reg ? "On file" : "Not issued yet")}</strong>
          <p>${student?.reg ? "Reg " + student.reg : "Issued after profile and fees are complete."}</p>
        </article>
        <article class="cred-card">
          <span class="cred-label">Programme certificate</span>
          <strong>${student?.certificateCode || (certs[0] && (certs[0].code || certs[0].certificateCode)) || "Not issued yet"}</strong>
          <p>${student?.program ? String(student.program) : "Appears when the academy publishes your certificate."}</p>
        </article>
      </div>
      <div class="m-list" style=${{ marginTop: 12 }}>
        ${certs.length
          ? certs.map((c) => html`<${ListCard} key=${c.id}
              badge=${(c.status || "OK").toString().slice(0, 3).toUpperCase()}
              title=${c.title || c.type || "Credential"}
              note=${[c.certificateCode || c.code || "", c.issuedAt || c.date || c.status || ""].filter(Boolean).join(" · ")}
              tone="lime" />`)
          : html`<${Empty} title="No certificate records yet" body="When ID cards or certificates are issued for you, the status will show above and in this list." />`}
      </div>
    `;
  } else if (section === "messages") {
    body = html`<${MessagesScreen} messages=${messages || []} student=${student} setSection=${setSection} />`;
  } else if (section === "transcript") {
    const list = (grades || []).slice().sort((a, b) => String(a.courseCode || a.courseTitle || "").localeCompare(String(b.courseCode || b.courseTitle || "")));
    const nums = list.map((g) => Number(g.score)).filter((n) => !Number.isNaN(n));
    const avg = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
    body = html`
      <${PageHead} title="Transcript" sub="Full published results" onBack=${() => setSection("grades")} backLabel="Grades" />
      <div class="panel" style=${{ marginBottom: 12 }}>
        <div class="cred-label">Student</div>
        <strong style=${{ fontSize: 16 }}>${student?.name || "—"}</strong>
        <p style=${{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>${student?.reg || "No reg yet"} · ${student?.program || "Programme TBD"}</p>
        <div style=${{ display: "flex", gap: 16, marginTop: 12 }}>
          <div><div class="cred-label">Modules</div><strong>${list.length}</strong></div>
          <div><div class="cred-label">Average</div><strong>${avg != null ? avg : "—"}</strong></div>
        </div>
      </div>
      <div class="m-list">
        ${list.length
          ? list.map((g) => html`<article class="m-card" key=${g.id}>
              <span class="badge tone-lime">${g.grade || (g.score != null ? g.score : "·")}</span>
              <div class="m-card-text">
                <h4>${g.courseTitle || g.courseCode || "Course"}</h4>
                <p>${[g.courseCode && g.courseTitle ? g.courseCode : "", g.score != null ? "Score " + g.score : "", g.remark || "", g.term || g.session || ""].filter(Boolean).join(" · ")}</p>
              </div>
            </article>`)
          : html`<${Empty} title="Transcript empty" body="Published grades will build your transcript here module by module." />`}
      </div>
    `;
  } else if (section === "settings") {
    body = html`<${SettingsScreen} student=${student} user=${user} onLogout=${onLogout} setSection=${setSection} />`;
  } else {
    body = html`
      <div class="page-head"><h1 class="display">Profile</h1><p>Your academy file</p></div>
      <div class="panel" style=${{ display: "flex", gap: 14, alignItems: "center" }}>
        <${Avatar} src=${student?.avatar} name=${name} size=${56} />
        <div>
          <b style=${{ fontFamily: "Montserrat, sans-serif", fontSize: 16 }}>${name}</b>
          <p style=${{ color: "var(--muted)", fontSize: 12, marginTop: 2 }}>${student?.email || ""}</p>
        </div>
      </div>
      <div class="panel" style=${{ marginTop: 12 }}>
        <div class="m-card"><div class="m-card-text"><h4>Reg number</h4><p>${student?.reg || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Programme</h4><p>${student?.program || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Cohort</h4><p>${student?.cohort || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Status</h4><p>${student?.status || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Phone</h4><p>${student?.phone || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Start date</h4><p>${student?.startDate || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Certificate code</h4><p>${student?.certificateCode || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Next of kin</h4><p>${student?.nextOfKin || "—"}</p></div></div>
        <div class="m-card" style=${{ marginTop: 8 }}><div class="m-card-text"><h4>Profile form</h4><p>${student?.profileCompleted ? "Completed" : "Not completed yet"}</p></div></div>
        ${!linked
          ? html`<div style=${{ marginTop: 12 }}><${Empty} title="Student file not linked" body="Ask admissions to put this exact email on your student record." /></div>`
          : html`<p style=${{ color: "var(--muted)", fontSize: 12, marginTop: 12, lineHeight: 1.4 }}>NIN and other legal details stay with the academy office. Contact them if something needs updating.</p>`}
      </div>
    `;
  }

  return html`<div class="m-app">
    <header class="m-top">
      <button class="icon-btn" aria-label="Open menu" aria-expanded=${menuOpen}
        onClick=${() => setMenuOpen(true)}>${Icon({ name: "menu", size: 18 })}</button>
      <div class="careed-brand" aria-label="CareEd powered by CGTIA">
        <img src="/assets/brand/cgtia-logo.webp" alt="" width="36" height="36" />
        <div class="careed-text">
          <strong>CareEd</strong>
          <span>Powered by CGTIA</span>
        </div>
      </div>
      <div class="m-top-r">
        <button type="button" class="notif-btn" aria-label="Notifications" onClick=${() => setNotifOpen(true)}>
          ${Icon({ name: "bell", size: 18 })}
          ${unreadNotifs ? html`<span class="dot"></span>` : null}
        </button>
        <${Avatar} src=${student?.avatar} name=${name} />
      </div>
    </header>
    ${body}
    <${MenuDrawer}
      open=${menuOpen}
      onClose=${closeMenu}
      student=${student}
      nav=${nav}
      section=${section}
      onSelect=${setSection}
      onLogout=${onLogout}
    />
    <${NotifDrawer}
      open=${notifOpen}
      onClose=${() => setNotifOpen(false)}
      items=${notifications || []}
      onOpen=${(n) => {
        setNotifOpen(false);
        if (n.section) setSection(n.section);
        else if (n.linkUrl) { try { window.open(n.linkUrl, "_blank", "noopener"); } catch (_) {} }
      }}
    />
  </div>`;
}
