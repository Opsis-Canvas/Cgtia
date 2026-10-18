
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
function LessonTtsPlayer({ text, title, hide }) {
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
    // Stop when text changes (new lesson)
    try { speechSynthesis.cancel(); } catch (_) {}
    setPlaying(false);
    setChunkIdx(0);
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
    if (playing) {
      // restart current chunk at new rate
      setTimeout(() => speakFrom(chunkIdx), 30);
    }
  }

  if (!chunks.length) return null;
  const pct = Math.round(((chunkIdx + (playing ? 0.5 : 0)) / total) * 100);

  return html`<div class=${"tts-player" + (hide ? " hide" : "")}>
    <div class="tts-player-top">
      <div class="meta">
        <strong>${title || "Listen"}</strong>
        <span>${playing ? "Playing" : "Paused"} · part ${Math.min(chunkIdx + 1, total)}/${total}</span>
      </div>
    </div>
    <div class="tts-prog"><i style=${{ width: Math.min(100, pct) + "%" }}></i></div>
    <div class="tts-controls">
      <button type="button" aria-label="Back" onClick=${skipBack}>↺ 10s</button>
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
          ? html`<div class="video-wrap"><iframe src=${toEmbed(l.videoUrl)} title=${l.title || "Video"} allowfullscreen loading="lazy"></iframe></div>`
          : null}
        ${l.body
          ? html`<div class=${"lesson-body fs-" + FONT_STEPS[fontStep]}>${l.body}</div>`
          : html`<p class="muted">No reading text for this lesson yet.</p>`}
      </div>
    </div>
    ${speakText ? html`<${LessonTtsPlayer} text=${speakText} title=${l.title || "Lesson"} hide=${ttsHide} />` : null}
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
    return html`<div class="page-head"><button type="button" class="ghost-back" onClick=${onBack}>← Back</button>
      <h1 class="display">Test</h1></div><${Empty} title="Not found" body="This test is no longer available." />`;
  }
  if (done || (questions.length && idx >= questions.length)) {
    let score = 0;
    questions.forEach((q, i) => {
      if (q.correct != null && String(answers[i]) === String(q.correct)) score += 1;
    });
    return html`<div class="page-head"><button type="button" class="ghost-back" onClick=${onBack}>← Back</button>
      <h1 class="display">Submitted</h1><p>${assessment.title}</p></div>
      <div class="panel"><p>You answered ${Object.keys(answers).length} of ${questions.length} questions.
      ${questions.some((q) => q.correct != null) ? " Score: " + score + " / " + questions.length + "." : " Your instructor will mark this."}</p>
      <button type="button" class="pill-ink" style=${{ marginTop: 12 }} onClick=${onBack}>Back to tests</button></div>`;
  }
  const q = questions[idx] || null;
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return html`<div class="test-shell" onCopy=${anti ? (e) => e.preventDefault() : undefined}>
    <div class="page-head">
      <button type="button" class="ghost-back" onClick=${onBack}>← Exit</button>
      <h1 class="display">${assessment.title}</h1>
      <p>${assessment.timerMinutes ? ("Time left " + mm + ":" + ss) : "No time limit"} · Q ${questions.length ? idx + 1 : 0}/${questions.length}</p>
    </div>
    ${warn ? html`<p class="warn-banner">${warn}</p>` : null}
    ${!questions.length
      ? html`<div class="panel"><p>${assessment.description || "No questions published yet. Check back later."}</p>
          <button type="button" class="pill-ink" onClick=${onBack}>Back</button></div>`
      : html`<div class="panel">
          <h3 style=${{ marginBottom: 12 }}>${q.prompt || q.text || "Question"}</h3>
          ${(q.options || []).map((opt, oi) => html`<label class="opt-row" key=${oi}>
            <input type="radio" name=${"q" + idx} checked=${String(answers[idx]) === String(oi)}
              onChange=${() => setAnswers({ ...answers, [idx]: oi })} />
            <span>${opt}</span>
          </label>`)}
          <div style=${{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
            ${idx > 0 ? html`<button type="button" class="ghost-back" onClick=${() => setIdx(idx - 1)}>Previous</button>` : null}
            <button type="button" class="pill-ink" onClick=${() => {
              if (idx + 1 >= questions.length) setDone(true);
              else setIdx(idx + 1);
            }}>${idx + 1 >= questions.length ? "Submit" : "Next"}</button>
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

function ListCard({ badge, title, note, tone, onClick, shaking }) {
  return html`<article class=${"m-card" + (onClick ? " is-click" : "") + (shaking ? " shake" : "")} role=${onClick ? "button" : undefined} onClick=${onClick}>
    <span class=${"badge tone-" + (tone || "mist")}>${badge}</span>
    <div class="m-card-text">
      <h4>${title}</h4>
      <p>${note || ""}</p>
    </div>
  </article>`;
}

function LessonList({ lessons, prog, cid, setSection }) {
  const [shakeId, setShakeId] = useState(null);
  const [warn, setWarn] = useState("");
  if (!lessons.length) {
    return html`<${Empty} title="No lessons yet" body="Your instructor will add videos and reading here." />`;
  }
  return html`<div class="m-list">
    ${warn ? html`<div class="lock-inline-warn">${warn}</div>` : null}
    ${lessons.map((l, i) => {
      const id = String(l.id != null ? l.id : i);
      const unlocked = i === 0 || prog.completed.includes(String(lessons[i - 1].id != null ? lessons[i - 1].id : (i - 1)));
      const done = prog.completed.includes(id);
      const num = String(i + 1).padStart(2, "0");
      const tone = done ? "done" : (!unlocked ? "lock" : (l.type === "video" ? "coral" : "sky"));
      const note = !unlocked
        ? "Finish the lesson above first"
        : ((l.type || "text") + (l.duration ? " · " + l.duration : "") + (done ? " · Completed" : ""));
      return html`<${ListCard} key=${id}
        badge=${num}
        title=${l.title || "Lesson"}
        note=${note}
        tone=${tone}
        shaking=${shakeId === id}
        onClick=${() => {
          if (unlocked) {
            setWarn("");
            setSection("lesson:" + cid + ":" + id);
          } else {
            setShakeId(id);
            setWarn("This lesson is locked. Complete “" + (lessons[i - 1]?.title || "the previous lesson") + "” first.");
            setTimeout(() => setShakeId(null), 500);
          }
        }} />`;
    })}
  </div>`;
}

export function MobileView({ ctx }) {

  const {
    student, nav, section, setSection, stats, courses, grades, payments,
    paidTotal, onLogout, linked, announcements, assessments
  } = ctx;
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const name = student?.name || "Student";
  const first = String(name).split(/\s+/)[0];

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
      ${(announcements || []).length ? html`<section class="ann-card is-click" role="button"
        onClick=${() => setSection("notice:" + (announcements[0].id || "0"))}>
        <h4>${announcements[0].title || "Announcement"}</h4>
        <p>${(announcements[0].body || announcements[0].message || "").slice(0, 120)}${(announcements[0].body || "").length > 120 ? "…" : ""}</p>
        <span class="ann-more">Tap for details →</span>
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
      <div class="page-head"><h1 class="display">My grades</h1><p>Published results only</p></div>
      <div class="m-list">
        ${grades.length
          ? grades.map((g) => html`<${ListCard} key=${g.id}
              badge=${g.grade || "·"}
              title=${g.courseTitle || g.courseCode || "Course"}
              note=${g.score != null ? "Score " + g.score : (g.remark || "")}
              tone="lime" />`)
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
  } else if (String(section || "").startsWith("notice:")
  } else if (String(section || "").startsWith("notice:")) {
    const nid = String(section).slice(7);
    const n = (announcements || []).find((a) => String(a.id) === nid) || (announcements || [])[0];
    body = html`
      <div class="page-head">
        <${BackBtn} label="Home" onClick=${() => setSection("dashboard")} />
        <h1 class="display">${n?.title || "Announcement"}</h1>
        <p>From the academy</p>
      </div>
      <div class="panel prose"><p>${n?.body || n?.message || "No further details."}</p></div>
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
      <div class="m-top-r">
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
  </div>`;
}
