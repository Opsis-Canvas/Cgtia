
import { createElement, useCallback, useState, useEffect, useRef } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { Avatar, Empty, StatusChip, ImageSlot, formatPayDate, money, loadProgress, markLessonDone, setModulePassed, formatLessonHtml } from "./shared.js";
import { ASSETS } from "./assets.js";
import { MenuDrawer } from "./drawer.view.js";
import { getFirebase } from "../../services/firebase.service.js";

const html = htm.bind(createElement);
const TILE_TONE = { courses: "sky", grades: "lilac", score: "sky-soft", fees: "mint" };

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

/* Lesson list sheet: progress, status per lesson, locked until the previous one is done */
function LessonRingNav({ lessons, prog, cid, currentId, onPick, onClose }) {
  const total = lessons.length;
  const idOf = (ls, i) => String(ls.id != null ? ls.id : i);
  const doneCount = lessons.filter((l, i) => prog.completed.includes(idOf(l, i))).length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  return html`<div class="ls-backdrop" onClick=${onClose}>
    <div class="ls-sheet" role="dialog" aria-modal="true" aria-label="Lessons" onClick=${(e) => e.stopPropagation()}>
      <div class="ls-handle" aria-hidden="true"></div>
      <div class="ls-head">
        <div>
          <h4>Lessons</h4>
          <p>${doneCount} of ${total} completed</p>
        </div>
        <button type="button" class="ls-x" aria-label="Close" onClick=${onClose}>×</button>
      </div>
      <div class="ls-bar" aria-hidden="true"><i style=${{ width: pct + "%" }}></i></div>
      <ol class="ls-list">
        ${lessons.map((ls, i) => {
          const id = idOf(ls, i);
          const done = prog.completed.includes(id);
          const open = i === 0 || prog.completed.includes(idOf(lessons[i - 1], i - 1));
          const current = id === String(currentId);
          const cls = "ls-item" + (done ? " is-done" : "") + (current ? " is-current" : "") + (!open ? " is-locked" : "");
          const note = current ? "Reading now" : done ? "Completed" : open ? "Ready to read" : "Finish the previous lesson first";
          return html`<li key=${id}>
            <button type="button" class=${cls} disabled=${!open} onClick=${() => { if (open) onPick(id); }}>
              <span class="ls-num">${done ? "✓" : String(i + 1).padStart(2, "0")}</span>
              <span class="ls-text"><strong>${ls.title || "Lesson " + (i + 1)}</strong><small>${note}</small></span>
            </button>
          </li>`;
        })}
      </ol>
    </div>
  </div>`;
}

const FONT_STEPS = ["sm", "md", "lg", "xl"];
const FONT_PX = { sm: 15, md: 17, lg: 19, xl: 22 };
const escapeText = (t) => String(t || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
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
      aria-label="Listen to this lesson" onClick=${() => setOpen(true)}>
      ${Icon({ name: "speaker", size: 18 })}<span>Listen</span>
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
    <${PageHead} title=${l.title || "Lesson"} sub=${(l.subheader || l.header || ((l.type || "text") + " · " + (idx + 1) + " of " + lessons.length))} onBack=${() => setSection("course:" + cid + ":lessons")} backLabel="Lessons" />
    ${speakText ? html`<${LessonTtsPlayer} text=${speakText} title=${l.title || "Lesson"} />` : null}
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
          ${(l.header || l.subheader || l.body || (l.blocks && l.blocks.length) || l.description)
            ? html`<div class=${"lesson-body fs-" + FONT_STEPS[fontStep]}
                style=${{ "--lesson-fs": FONT_PX[FONT_STEPS[fontStep]] + "px" }}
                dangerouslySetInnerHTML=${{ __html: formatLessonHtml(l) || ("<p>" + escapeText(l.description) + "</p>") }}></div>`
            : html`<p class="muted">No reading text for this lesson yet.</p>`}
          <div class="lesson-fade-bottom"></div>
        </div>
      </div>
    </div>
    <div style=${{ padding: "16px 0 100px" }}>
      <button type="button" class="btn-block" onClick=${completeAndNext}>
        ${(Array.isArray(l.checkQuestions) && l.checkQuestions.filter((q) => q.prompt).length)
          ? "Take quick check"
          : (idx + 1 < lessons.length ? "Mark done · Next lesson" : "Mark done · Finish module")}
      </button>
    </div>
    <button type="button" class="lesson-pill" aria-label="Open lesson list" onClick=${() => setNavOpen(true)}>
      ${Icon({ name: "grid", size: 16 })}<span>Lessons</span><b>${idx + 1}/${lessons.length}</b>
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



function Tile({ s, onClick, idx = 0 }) {
  const brand = (idx % 2 === 0) ? "brand-navy" : "brand-blue";
  return html`<div role=${onClick ? "button" : undefined}
    class=${"m-tile " + brand + (onClick ? " is-click" : "")}
    onClick=${onClick}>
    <span class="tile-icon">${Icon({ name: s.icon || "grid", size: 18 })}</span>
    <div class="tile-body">
      <div class="num">${s.value}${s.total != null ? html`<span>/${s.total}</span>` : null}</div>
      <div class="lbl">${s.label}</div>
    </div>
  </div>`;
}



/* ---------- shared helpers for the redesigned result, attendance and transcript ---------- */
function toDayKey(v) {
  if (!v) return "";
  if (typeof v === "string") { const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/); return m ? m[1] + "-" + m[2] + "-" + m[3] : ""; }
  if (v.toDate) { const d = v.toDate(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  return "";
}
function pick(obj, keys) {
  for (const k of keys) if (obj && obj[k] != null && obj[k] !== "") return obj[k];
  return "—";
}

/* Score ring: starts slow, builds and shakes harder, then lands on the real percentage */
const RING_R = 86;
const RING_C = 2 * Math.PI * RING_R;
export function ScoreResult({ pct, auto, score, total, answered, sub, onBack, questions, answers, assessment, student }) {
  const target = auto ? pct : 100;
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [val, setVal] = useState(reduce ? target : 0);
  const [building, setBuilding] = useState(!reduce);
  const [jitter, setJitter] = useState({ x: 0, y: 0, r: 0 });
  useEffect(() => {
    if (reduce) return undefined;
    const DUR = 3600;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - t0) / DUR);
      const climb = 0.86;
      const eased = t < climb
        ? Math.pow(t / climb, 2.4) * 0.9
        : 0.9 + (1 - Math.pow(1 - (t - climb) / (1 - climb), 2)) * 0.1;
      setVal(Math.round(target * eased));
      const amp = t < climb ? 0.4 + 3.4 * Math.pow(t / climb, 2) : 0;
      setJitter({ x: Math.sin(now / 26) * amp, y: Math.cos(now / 31) * amp * 0.6, r: Math.sin(now / 37) * amp * 0.5 });
      if (t < 1) raf = requestAnimationFrame(tick);
      else { setVal(target); setJitter({ x: 0, y: 0, r: 0 }); setBuilding(false); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const passed = auto && pct >= 70;
  const tone = !auto ? "is-neutral" : passed ? "is-pass" : "is-retry";
  const heading = !auto ? "Answers received" : passed ? "Well done" : "Keep practising";
  const lead = auto
    ? "You scored " + score + " out of " + total + " on this check."
    : "You answered " + answered + " of " + total + ". Your instructor will mark this.";
  const dash = RING_C * (1 - val / 100);
  const showReview = !!(assessment && assessment.showReview === true && auto && questions && questions.length);
  return html`<div class="result-screen">
    <${PageHead} title="Done" sub=${sub} onBack=${onBack} backLabel="Tests" />
    <div class=${"result-hero " + tone + (building ? " is-building" : " is-done")}>
      <div class="result-ring" style=${{ transform: "translate(" + jitter.x + "px," + jitter.y + "px) rotate(" + jitter.r + "deg)" }}>
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle class="ring-track" cx="100" cy="100" r=${RING_R} />
          <circle class="ring-fill" cx="100" cy="100" r=${RING_R} stroke=${val >= 70 ? "#0948e6" : "#b91c1c"} stroke-dasharray=${RING_C} stroke-dashoffset=${dash} transform="rotate(-90 100 100)" />
        </svg>
        <span class="result-ring-val">${auto ? val + "%" : "✓"}</span>
      </div>
      <div class="result-copy">
        <h3 class="display">${heading}</h3>
        <p class="result-lead">${lead}</p>
        <div class="result-stats">
          <div><strong>${answered}</strong><span>Answered</span></div>
          <div><strong>${auto ? score : "—"}</strong><span>Correct</span></div>
          <div><strong>${total}</strong><span>Questions</span></div>
        </div>
        ${showReview ? html`<${ReviewAnswers} questions=${questions} answers=${answers || {}} assessment=${assessment} student=${student} />` : null}
        <button type="button" class="btn-block" onClick=${onBack}>Back to tests</button>
      </div>
    </div>
  </div>`;
}





/* Image frame: the graphic designer's file, shown at its exact size for phones (portrait) or desktop (landscape) */
export function ImageFrame({ mobile, desktop, alt }) {
  const m = mobile || desktop;
  const d = desktop || mobile;
  if (!m) return null;
  return html`<picture class="img-frame">
    ${d ? html`<source media="(min-width: 860px)" srcset=${d} />` : null}
    <img src=${m} alt=${alt || ""} loading="lazy" decoding="async" />
  </picture>`;
}

/* Dashboard carousel: admin-managed slides, autoplay, pause on hover (desktop) or on press-and-hold (phone), swipe, dots, CTA */
export function SlideCarousel({ slides, seconds }) {
  const list = slides || [];
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);
  const ms = Math.max(3, Number(seconds) || 6) * 1000;
  useEffect(() => {
    if (list.length < 2 || paused) return undefined;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), ms);
    return () => clearInterval(t);
  }, [list.length, paused, ms]);
  const safeIdx = list.length ? idx % list.length : 0;
  if (!list.length) return null;
  const go = (k) => setIdx((k + list.length) % list.length);
  const pause = () => setPaused(true);
  const resume = () => setPaused(false);
  return html`<section class="slides" aria-roledescription="carousel" aria-label="Highlights"
      onMouseEnter=${pause} onMouseLeave=${resume}
      onPointerDown=${pause} onPointerUp=${resume} onPointerCancel=${resume}
      onTouchStart=${(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd=${(e) => {
        if (touchX.current == null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 40) go(safeIdx + (dx < 0 ? 1 : -1));
      }}>
    <div class="slides-stage">
      ${list.map((s, k) => html`<article class=${"slide" + (k === safeIdx ? " is-on" : "")} key=${s.id} aria-hidden=${k !== safeIdx ? "true" : "false"}>
        ${(s.imageMobile || s.imageDesktop)
          ? html`<${ImageFrame} mobile=${s.imageMobile} desktop=${s.imageDesktop} alt=${s.title || ""} />`
          : html`<div class="slide-text"><h3>${s.title}</h3>${s.body ? html`<p>${s.body}</p>` : null}</div>`}
        ${s.ctaUrl ? html`<a class="slide-cta" href=${s.ctaUrl} target="_blank" rel="noopener" tabindex=${k === safeIdx ? "0" : "-1"}>${s.ctaLabel || "Learn more"} →</a>` : null}
      </article>`)}
    </div>
    ${list.length > 1 ? html`<div class="slides-dots">
      ${list.map((_, k) => html`<button type="button" key=${k} class=${"slides-dot" + (k === safeIdx ? " on" : "")} aria-label=${"Show slide " + (k + 1)} onClick=${() => go(k)}></button>`)}
    </div>` : null}
  </section>`;
}

/* Module card: number, title, progress, lesson count, status, next action */
export function ModuleCard({ c, i, email, onOpen }) {
  const lessons = Array.isArray(c.lessons) ? c.lessons : [];
  const prog = loadProgress(email, c.id);
  const done = lessons.filter((l, k) => prog.completed.includes(String(l.id != null ? l.id : k))).length;
  const total = lessons.length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const finished = total > 0 && done >= total;
  const cta = finished ? "Completed" : done > 0 ? "Continue" : "Start";
  return html`<article class=${"mod-card" + (finished ? " is-done" : "")} role="button" tabindex="0"
      onClick=${onOpen} onKeyDown=${(e) => { if (e.key === "Enter") onOpen(); }}>
    <div class="mod-top">
      <span class="mod-num">${String(i + 1).padStart(2, "0")}</span>
      <div class="mod-title"><h4>${c.title || c.code || "Module"}</h4><p>${c.code || "Module"}${c.program ? " · " + c.program : ""}</p></div>
    </div>
    <div class="mod-chips">
      <span class="mod-chip">${total} lesson${total === 1 ? "" : "s"}</span>
      ${(c.moduleQuizQuestions || []).length ? html`<span class="mod-chip">Module quiz</span>` : null}
      ${prog.modulePassed ? html`<span class="mod-chip is-ok">Passed</span>` : null}
    </div>
    <div class="mod-foot">
      <div class="mod-prog"><div class="mod-bar"><i style=${{ width: pct + "%" }}></i></div><small>${done} of ${total} · ${pct}%</small></div>
      <span class="mod-cta">${cta} →</span>
    </div>
  </article>`;
}

/* Offers: swipeable cards with snap and dots (plain offers are white, linked ones are brand colour) */
export function OffersCarousel({ promos }) {
  const ref = useRef(null);
  const [idx, setIdx] = useState(0);
  const list = promos || [];
  const step = (el) => (el && el.firstElementChild ? el.firstElementChild.getBoundingClientRect().width + 12 : 0);
  function onScroll(e) {
    const el = e.currentTarget;
    const w = step(el) || 1;
    setIdx(Math.min(list.length - 1, Math.max(0, Math.round(el.scrollLeft / w))));
  }
  function go(k) {
    const el = ref.current;
    if (!el) return;
    el.scrollTo({ left: k * step(el), behavior: "smooth" });
  }
  return html`<section class="offers">
    <div class="m-section-h"><h3 class="display">Offers</h3>${list.length > 1 ? html`<span class="offers-count">${idx + 1} / ${list.length}</span>` : null}</div>
    <div class="offers-track" ref=${ref} onScroll=${onScroll}>
      ${list.map((p) => {
        const body = p.body || p.description || "";
        const amt = Number(p.promoAmount) > 0 ? "₦" + Number(p.promoAmount).toLocaleString("en-NG") : "";
        return html`<article class=${"offer" + (p.linkUrl ? " has-link" : "")} key=${p.id}>
          ${(p.imageMobile || p.imageDesktop) ? html`<${ImageFrame} mobile=${p.imageMobile} desktop=${p.imageDesktop} alt=${p.title || ""} />` : null}
          <div class="offer-top"><span class="offer-tag">${p.badge || "Offer"}</span>${amt ? html`<span class="offer-amt">${amt}</span>` : null}</div>
          <h4>${p.title || "Offer"}</h4>
          ${body ? html`<p>${body}</p>` : null}
          ${p.linkUrl
            ? html`<a class="offer-cta" href=${p.linkUrl} target="_blank" rel="noopener">${p.linkLabel || "View offer"} →</a>`
            : html`<span class="offer-cta is-muted">Ask the office</span>`}
        </article>`;
      })}
    </div>
    ${list.length > 1 ? html`<div class="offers-dots">${list.map((p, k) => html`<button type="button" key=${p.id} class=${"offers-dot" + (k === idx ? " on" : "")} aria-label=${"Show offer " + (k + 1)} onClick=${() => go(k)}></button>`)}</div>` : null}
  </section>`;
}

/* Notices: one inbox list, the same on phone and desktop (title, preview, date, link marker) */
function noticeDate(t) {
  const ms = t && t.toMillis ? t.toMillis() : (t ? new Date(t).getTime() : 0);
  if (!ms || isNaN(ms)) return "";
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
export function NoticeInbox({ items, setSection, limit = 4 }) {
  const list = (items || []).slice(0, limit);
  const [openId, setOpenId] = useState(null);
  return html`<section class="inbox">
    <div class="m-section-h"><h3 class="display">Notices</h3></div>
    <div class="notice-stack">
      ${list.map((a) => {
        const open = openId === a.id;
        const body = String(a.body || a.message || "");
        return html`<article class=${"notice" + (open ? " is-open" : "") + (a.linkUrl ? " has-link" : "")} key=${a.id}>
          <button type="button" class="notice-head" aria-expanded=${open ? "true" : "false"} onClick=${() => setOpenId(open ? null : a.id)}>
            <span class="notice-ico" aria-hidden="true">${a.linkUrl ? "↗" : "i"}</span>
            <span class="notice-title"><strong>${a.title || "Notice"}</strong><small>${noticeDate(a.createdAt || a.publishedAt || a.date)}</small></span>
            <span class="notice-chev" aria-hidden="true">⌄</span>
          </button>
          <div class="notice-body"><div class="notice-body-in">
            ${body ? html`<p>${body}</p>` : html`<p class="muted">No further details.</p>`}
            <div class="notice-actions">
              ${a.linkUrl ? html`<a class="notice-cta" href=${a.linkUrl} target="_blank" rel="noopener">${a.linkLabel || "Open link"} →</a>` : null}
              <button type="button" class="notice-more" onClick=${() => setSection("notice:" + a.id)}>Full notice</button>
            </div>
          </div></div>
        </article>`;
      })}
    </div>
  </section>`;
}

/* Attendance card: a visible summary that opens the attendance page */
export function attendanceStrip(rows, onOpen) {
  const list = rows || [];
  const present = list.filter((r) => /present|yes|attended/i.test(String(r.status || r.present || ""))).length;
  const pct = list.length ? Math.round((present / list.length) * 100) : null;
  return html`<button type="button" class="att-strip" onClick=${onOpen}>
    <span class="att-strip-ico" aria-hidden="true">${Icon({ name: "check", size: 18 })}</span>
    <span class="att-strip-text">
      <strong>${pct != null ? pct + "% attendance" : "Attendance"}</strong>
      <small>${pct != null ? present + " of " + list.length + " sessions present" : "Sessions appear here once your tutor marks them"}</small>
      ${pct != null ? html`<span class="att-strip-bar"><i style=${{ width: pct + "%" }}></i></span>` : null}
    </span>
    <span class="att-strip-go" aria-hidden="true">›</span>
  </button>`;
}

/* Grade colour: A green, B blue, C teal, D amber, E orange, F red */
export function gradeTone(g) {
  const k = String((g && g.grade) || "").trim().toUpperCase().charAt(0);
  return "gr-" + (/[A-F]/.test(k) ? k.toLowerCase() : "x");
}

/* Schedule: each row is a section; tapping one opens its details */
const SCH_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
function schKind(s) { return s.sectionType || "Class"; }
function schProgram(p) {
  if (!p || p === "all") return "All programmes";
  return String(p).replace(/(^|[\s-])\w/g, (m) => m.toUpperCase()).replace(/-/g, " ");
}
export function ScheduleList({ schedule }) {
  const [open, setOpen] = useState(null);
  const list = schedule || [];
  const byDay = {};
  list.forEach((x) => { const d = x.day || x.weekday || "Other"; (byDay[d] = byDay[d] || []).push(x); });
  const order = SCH_DAYS.filter((d) => byDay[d]).concat(Object.keys(byDay).filter((d) => !SCH_DAYS.includes(d)));
  if (!list.length) {
    return html`<${Empty} title="No timetable yet" body="When the academy publishes class times for your programme, they will show up here." />`;
  }
  return html`<div class="sch">
    ${order.map((d) => html`<section class="sch-day" key=${d}>
      <h3 class="sch-h">${d}</h3>
      <div class="sch-list">
        ${byDay[d].map((x) => html`<button type="button" class="sch-row" key=${x.id} onClick=${() => setOpen(x)}>
          <span class="sch-time"><b>${(x.startTime || x.time || "—").toString().slice(0, 5)}</b><small>${x.endTime ? "to " + String(x.endTime).slice(0, 5) : ""}</small></span>
          <span class="sch-text"><strong>${x.title || x.courseTitle || "Session"}</strong><small>${[x.room || x.venue || "", x.tutor || x.instructor || ""].filter(Boolean).join(" · ") || "Class session"}</small></span>
          <span class=${"sch-kind is-" + schKind(x).toLowerCase().replace(/[^a-z]+/g, "-")}>${schKind(x)}</span>
        </button>`)}
      </div>
    </section>`)}
    ${open ? html`<${ScheduleSheet} item=${open} onClose=${() => setOpen(null)} />` : null}
  </div>`;
}

function ScheduleSheet({ item, onClose }) {
  const rows = [
    ["Day", item.day || "—"],
    ["Time", [item.startTime, item.endTime].filter(Boolean).map((t) => String(t).slice(0, 5)).join(" – ") || "—"],
    ["Venue", item.room || item.venue || "—"],
    ["Tutor", item.tutor || item.instructor || "—"],
    ["Module", item.courseTitle ? (item.courseCode ? item.courseCode + " · " : "") + item.courseTitle : "—"],
    ["Programme", schProgram(item.program)]
  ];
  return html`<div class="ls-backdrop" onClick=${onClose}>
    <div class="ls-sheet" role="dialog" aria-modal="true" aria-label=${item.title || "Session"} onClick=${(e) => e.stopPropagation()}>
      <div class="ls-handle" aria-hidden="true"></div>
      <div class="ls-head">
        <div>
          <span class=${"sch-kind is-" + schKind(item).toLowerCase().replace(/[^a-z]+/g, "-")}>${schKind(item)}</span>
          <h4 style=${{ marginTop: 8 }}>${item.title || item.courseTitle || "Session"}</h4>
        </div>
        <button type="button" class="ls-x" aria-label="Close" onClick=${onClose}>×</button>
      </div>
      <dl class="sch-details">
        ${rows.map(([k, v]) => html`<div class="sch-d" key=${k}><dt>${k}</dt><dd>${v}</dd></div>`)}
      </dl>
      <p class="sch-foot">Your tutor marks attendance for this session. It appears under Attendance once recorded.</p>
    </div>
  </div>`;
}

/* Profile: identity card, record grid, status notes */
export function ProfileCard({ student, linked, name }) {
  const rows = [
    ["Reg number", student?.reg],
    ["Programme", student?.program],
    ["Cohort", student?.cohort],
    ["Status", student?.status],
    ["Start date", student?.startDate],
    ["Phone", student?.phone],
    ["Certificate code", student?.certificateCode],
    ["Next of kin", student?.nextOfKin]
  ];
  return html`<div class="pf">
    <section class="pf-hero">
      <${Avatar} src=${student?.avatar} name=${name} size=${72} />
      <div class="pf-id">
        <h2>${name}</h2>
        <p>${student?.email || ""}</p>
        <span class=${"pf-chip " + (linked ? "is-ok" : "is-warn")}>${linked ? "File linked" : "File not linked"}</span>
      </div>
    </section>
    <section class="pf-grid">
      ${rows.map(([k, v]) => html`<div class="pf-cell" key=${k}><span>${k}</span><strong>${v || "—"}</strong></div>`)}
    </section>
    <section class="pf-note">
      <span>Profile form</span>
      <strong>${student?.profileCompleted ? "Completed" : "Not completed yet"}</strong>
    </section>
    ${linked
      ? html`<p class="pf-foot">NIN and other legal details stay with the academy office. Contact them to update anything here.</p>`
      : html`<${Empty} title="Student file not linked" body="Ask admissions to put this exact email on your student record." />`}
  </div>`;
}

/* The student's own answer queries, with the office reply once resolved */
export function MyQueries({ student }) {
  const [rows, setRows] = useState([]);
  const email = String(student?.email || "").toLowerCase();
  useEffect(() => {
    if (!email) return;
    (async () => {
      try {
        const { db, api } = await getFirebase();
        const snap = await api.getDocs(api.query(api.collection(db, "answerQueries"), api.where("studentEmail", "==", email)));
        const list = [];
        snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
        const ms = (t) => (t && t.toMillis ? t.toMillis() : 0);
        list.sort((a, b) => ms(b.createdAt) - ms(a.createdAt));
        setRows(list);
      } catch (_) { setRows([]); }
    })();
  }, [email]);
  if (!rows.length) return null;
  return html`<section class="mq">
    <h4 class="review-h">Your answer queries</h4>
    ${rows.map((r) => html`<article class=${"mq-item " + (r.status === "resolved" ? "is-done" : "is-open")} key=${r.id}>
      <div class="mq-top"><span>${r.assessmentTitle || "Test"} · Q${(Number(r.questionIndex) || 0) + 1}</span><em>${r.status === "resolved" ? "Resolved" : "Under review"}</em></div>
      <p class="mq-msg">${r.message || ""}</p>
      ${r.reply ? html`<div class="mq-reply"><span>Office reply</span>${r.reply}</div>` : null}
    </article>`)}
  </section>`;
}

/* Question-by-question review (only when the office switched review on for this test) */
function ReviewAnswers({ questions, answers, assessment, student }) {
  const [open, setOpen] = useState(null);
  const [text, setText] = useState("");
  const [sent, setSent] = useState({});
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const optText = (q, i) => (answers[i] != null && (q.options || [])[answers[i]] != null) ? q.options[answers[i]] : "No answer";
  async function send(i, q, yours, correct) {
    if (!text.trim()) { setErr("Write a short reason for your query first."); return; }
    setBusy(true); setErr("");
    try {
      const { db, api } = await getFirebase();
      await api.addDoc(api.collection(db, "answerQueries"), {
        assessmentId: assessment.id || "",
        assessmentTitle: assessment.title || "",
        questionIndex: i,
        questionPrompt: q.prompt || q.text || "",
        yourAnswer: yours,
        correctAnswer: correct,
        message: text.trim(),
        studentId: student?.id || "",
        studentName: student?.name || "",
        studentEmail: student?.email || "",
        status: "open",
        reply: "",
        createdAt: api.serverTimestamp()
      });
      setSent({ ...sent, [i]: true });
      setOpen(null); setText("");
    } catch (e) {
      setErr("Your query could not be sent. Check your connection and try again.");
    } finally { setBusy(false); }
  }
  return html`<section class="review">
    <h4 class="review-h">Review your answers</h4>
    ${questions.map((q, i) => {
      const ok = answers[i] != null && String(answers[i]) === String(q.correct);
      const yours = optText(q, i);
      const correct = (q.options || [])[q.correct] != null ? q.options[q.correct] : "—";
      return html`<article class=${"rv-item " + (ok ? "is-ok" : "is-bad")} key=${i}>
        <div class="rv-top"><span class="rv-no">Q${i + 1}</span><span class="rv-state">${ok ? "Correct" : "Wrong"}</span></div>
        <p class="rv-q">${q.prompt || q.text || "Question"}</p>
        <p class="rv-line"><span>Your answer</span>${yours}</p>
        ${ok ? null : html`<p class="rv-line"><span>Correct answer</span>${correct}</p>`}
        ${sent[i]
          ? html`<p class="rv-sent">Query sent. The office will review it.</p>`
          : open === i
            ? html`<div class="rv-query">
                <textarea rows="3" value=${text} placeholder="Why do you think this marking is wrong?" onInput=${(e) => setText(e.target.value)}></textarea>
                ${err ? html`<p class="rv-err" role="alert">${err}</p>` : null}
                <div class="rv-actions">
                  <button type="button" class="rv-send" disabled=${busy} onClick=${() => send(i, q, yours, correct)}>${busy ? "Sending…" : "Send query"}</button>
                  <button type="button" class="rv-cancel" onClick=${() => { setOpen(null); setText(""); setErr(""); }}>Cancel</button>
                </div>
              </div>`
            : html`<button type="button" class="rv-ask" onClick=${() => { setOpen(i); setText(""); setErr(""); }}>${ok ? "Question this answer" : "Query this answer"}</button>`}
      </article>`;
    })}
  </section>`;
}

/* Branded month calendar: green dot = present, plum = absent, gold ring = today */
export function AttendanceCalendar({ rows }) {
  const now = new Date();
  const [cursor, setCursor] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const marks = {};
  (rows || []).forEach((r) => {
    const k = toDayKey(r.date || r.sessionDate);
    if (!k) return;
    marks[k] = /present|yes|attended/i.test(String(r.status || r.present || "")) ? "P" : "A";
  });
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const lead = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(d);
  const keyOf = (d) => y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  const todayKey = y === now.getFullYear() && m === now.getMonth() ? toDayKey(now) : "";
  // toDayKey reads Date-like values via toDate(); build a local key for "today"
  const todayLocal = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0");
  const monthName = cursor.toLocaleString("en-GB", { month: "long" });
  const monthRows = Object.keys(marks).filter((k) => k.startsWith(y + "-" + String(m + 1).padStart(2, "0")));
  const monthPresent = monthRows.filter((k) => marks[k] === "P").length;
  return html`<div class="att-cal">
    <div class="att-head">
      <button type="button" class="att-nav" aria-label="Previous month" onClick=${() => setCursor(new Date(y, m - 1, 1))}>‹</button>
      <div class="att-title"><strong>${monthName} ${y}</strong><span>${monthRows.length ? monthPresent + " of " + monthRows.length + " present" : "No sessions marked"}</span></div>
      <button type="button" class="att-nav" aria-label="Next month" onClick=${() => setCursor(new Date(y, m + 1, 1))}>›</button>
    </div>
    <div class="att-dow">${["S", "M", "T", "W", "T", "F", "S"].map((d, i) => html`<span key=${i}>${d}</span>`)}</div>
    <div class="att-grid">
      ${cells.map((d, i) => {
        if (d == null) return html`<span key=${"e" + i} class="att-cell is-empty"></span>`;
        const k = keyOf(d);
        const st = marks[k] || "";
        const cls = "att-cell" + (st === "P" ? " is-p" : st === "A" ? " is-a" : "") + (k === todayLocal ? " is-today" : "");
        return html`<span key=${i} class=${cls}>${d}</span>`;
      })}
    </div>
    <div class="att-legend"><span><i class="dot dot-p"></i>Present</span><span><i class="dot dot-a"></i>Absent</span><span><i class="dot dot-t"></i>Today</span></div>
  </div>`;
}

/* Transcript: one table with every assessment column, printable, with the student photo */
export function TranscriptView({ student, grades }) {
  const list = (grades || []).slice().sort((a, b) => String(a.courseCode || a.courseTitle || "").localeCompare(String(b.courseCode || b.courseTitle || "")));
  const nums = list.map((g) => Number(g.score)).filter((n) => !Number.isNaN(n));
  const avg = nums.length ? Math.round(nums.reduce((a, b) => a + b, 0) / nums.length) : null;
  const issued = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const name = student?.name || "Student";
  const txCols = (() => {
    const seen = {}; const out = [];
    list.forEach((g) => (g.componentDefs || []).forEach((c) => { if (!seen[c.key]) { seen[c.key] = true; out.push({ key: c.key, label: c.label || c.key }); } }));
    return out.length ? out : [{ key: "ca", label: "CA" }, { key: "test", label: "Test" }, { key: "exam", label: "Exam" }, { key: "attendance", label: "Attend." }];
  })();
  const txVal = (g, k) => {
    const v = (g.components && g.components[k] != null) ? g.components[k] : g[k];
    return v != null && v !== "" ? v : "—";
  };
  return html`<div class="tx-wrap">
    <div class="tx-actions">
      <button type="button" class="pill-ink" onClick=${() => { try { window.print(); } catch (_) {} }}>Print / save as PDF</button>
    </div>
    <article class="tx-sheet">
      <header class="tx-head">
        <div class="tx-photo">
          ${student?.avatar
            ? html`<img src=${student.avatar} alt=${name} />`
            : html`<span>${String(name).charAt(0).toUpperCase()}</span>`}
        </div>
        <div class="tx-id">
          <span class="tx-kicker">Academic transcript</span>
          <h2>${name}</h2>
          <p>Reg ${student?.reg || "—"} · ${student?.program || "Programme TBD"}</p>
          <p class="tx-date">Issued ${issued}</p>
        </div>
        <img class="tx-logo" src="/assets/brand/cgtia-logo.webp" alt="CGTIA" width="56" height="56" />
      </header>
      <div class="tx-summary">
        <div><strong>${list.length}</strong><span>Modules</span></div>
        <div><strong>${avg != null ? avg : "—"}</strong><span>Average</span></div>
        <div><strong>${student?.cohort || "—"}</strong><span>Cohort</span></div>
      </div>
      ${list.length
        ? html`<div class="tx-scroll"><table class="tx-table">
            <thead><tr><th>Course</th>${txCols.map((c) => html`<th key=${c.key}>${c.label}</th>`)}<th>Score</th><th>Grade</th><th>Remark</th></tr></thead>
            <tbody>
              ${list.map((g) => html`<tr key=${g.id}>
                <td><strong>${g.courseCode || ""}</strong>${g.courseTitle ? html`<span class="tx-course">${g.courseTitle}</span>` : null}</td>
                ${txCols.map((c) => html`<td key=${c.key}>${txVal(g, c.key)}</td>`)}
                <td>${g.score != null ? g.score : "—"}</td>
                <td><span class=${"tx-grade " + gradeTone(g)}>${g.grade || "—"}</span></td>
                <td>${g.remark || "—"}</td>
              </tr>`)}
            </tbody>
          </table></div>`
        : html`<${Empty} title="Transcript empty" body="Published grades will build your transcript here module by module." />`}
      <footer class="tx-foot"><span>CGTIA · CareEd student record</span><span>Verify with the academy office</span></footer>
    </article>
  </div>`;
}

function TakeTest({ assessment, questions, onBack, student }) {
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
      <div class="status-card is-error" role="alert">
        <span class="status-icon" aria-hidden="true">!</span>
        <h3>Test not available</h3>
        <p>This test has been closed or moved. Go back to your tests list to see what is open.</p>
        <button type="button" class="status-btn" onClick=${onBack}>Back to tests</button>
      </div>
    </div>`;
  }
  if (done || (questions.length && idx >= questions.length)) {
    let score = 0;
    questions.forEach((q, i) => {
      if (q.correct != null && String(answers[i]) === String(q.correct)) score += 1;
    });
    const total = questions.length || 1;
    const auto = questions.some((q) => q.correct != null);
    const answered = Object.keys(answers).length;
    const pct = Math.round((score / total) * 100);
    return html`<${ScoreResult} pct=${pct} auto=${auto} score=${score} total=${total} answered=${answered} sub=${assessment.title} onBack=${onBack} questions=${questions} answers=${answers} assessment=${assessment} student=${student} />`;
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
  return html`<div class="m-list lesson-list">
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


export function MessagesScreen({ messages, student, setSection }) {
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

export function SettingsScreen({ student, user, onLogout, setSection }) {
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [notify, setNotify] = useState(() => {
    try { return localStorage.getItem("cgtia_notify") !== "0"; } catch (_) { return true; }
  });
  const [dark, setDark] = useState(() => {
    /* Night mode ON by default; only stay light if user explicitly chose it */
    try {
      const v = localStorage.getItem("cgtia_theme");
      if (v === "light") return false;
      if (v !== "dark") {
        try { localStorage.setItem("cgtia_theme", "dark"); } catch (_) {}
      }
      return true;
    } catch (_) { return true; }
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
  if (!open) return null;
  return html`<div class="notif-drawer open">
    <div class="notif-scrim" onClick=${onClose}></div>
    <aside class="notif-panel" role="dialog" aria-modal="true" aria-label="Notifications">
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
    paidTotal, onLogout, linked, announcements, promos, slides, slideSeconds, assessments,
    certificates, attendance, schedule, messages, notifications, user
  } = ctx;
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  useEffect(() => {
    const lock = menuOpen || notifOpen;
    try {
      document.documentElement.style.overflow = lock ? "hidden" : "";
      document.body.style.overflow = lock ? "hidden" : "";
    } catch (_) {}
    return () => {
      try {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      } catch (_) {}
    };
  }, [menuOpen, notifOpen]);
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
      ${(slides || []).length ? html`<${SlideCarousel} slides=${slides} seconds=${slideSeconds} />` : html`
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
        <img
          class="m-banner-img"
          src="/assets/banner-person.webp"
          alt=""
          decoding="async"
          style=${{
            position: "absolute",
            right: "-4px",
            bottom: "0px",
            height: "108%",
            width: "auto",
            maxWidth: "56%",
            objectFit: "contain",
            objectPosition: "bottom right",
            zIndex: 3,
            pointerEvents: "none",
            display: "block"
          }}
        />
      </section>
      `}
      ${(promos || []).length ? html`<${OffersCarousel} promos=${promos} />` : null}
      ${(announcements || []).length ? html`<${NoticeInbox} items=${announcements} setSection=${setSection} limit=${4} />` : null}
      <section class="m-tiles">
        ${stats.map((s, idx) => html`<${Tile} key=${s.id} s=${s} idx=${idx} onClick=${() => {
          if (s.id === "courses" || s.go === "courses") setSection("courses");
          else if (s.id === "grades" || s.id === "score" || s.go === "grades") setSection("grades");
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
      ${attendanceStrip(ctx.attendance, () => setSection("attendance"))}
      <section>
        <div class="m-section-h">
          <h3 class="display">Modules</h3>
          ${courses.length ? html`<button type="button" class="see" style=${{ border: 0, background: "none" }} onClick=${() => setSection("courses")}>See all</button>` : null}
        </div>
        <div class="m-list">
          ${courses.length
            ? courses.slice(0, 3).map((c, i) => html`<${ModuleCard} key=${c.id} c=${c} i=${i} email=${ctx.student && ctx.student.email} onOpen=${() => setSection("course:" + c.id)} />`)
            : html`<${Empty} title="No modules yet" body="They will show here once your programme is on file." />`}
        </div>
      </section>
    `;
  } else if (section === "courses") {
    body = html`
      <div class="page-head"><h1 class="display">Courses</h1><p>Your programme modules</p></div>
      <div class="m-list">
        ${courses.length
          ? courses.map((c, i) => html`<${ModuleCard} key=${c.id} c=${c} i=${i} email=${ctx.student && ctx.student.email} onOpen=${() => setSection("course:" + c.id)} />`)
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
      ${(n && (n.imageMobile || n.imageDesktop)) ? html`<${ImageFrame} mobile=${n.imageMobile} desktop=${n.imageDesktop} alt=${n.title || ""} />` : null}
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
    body = html`<${TakeTest} assessment=${a} questions=${qs} student=${ctx.student} onBack=${() => setSection("assessments")} />`;
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
    body = html`
      <${PageHead} title="Schedule" sub="Class times for your track" onBack=${() => setSection("dashboard")} backLabel="Home" />
      <${ScheduleList} schedule=${schedule || []} />
    `;
  } else if (section === "attendance") {
    const rows = attendance || [];
    const present = rows.filter((r) => /present|yes|1|attended/i.test(String(r.status || r.present || ""))).length;
    const pct = rows.length ? Math.round((present / rows.length) * 100) : null;
    body = html`
      <${PageHead} title="Attendance" sub="Sessions marked by your instructors" onBack=${() => setSection("dashboard")} backLabel="Home" />
      <${AttendanceCalendar} rows=${rows} />
      ${rows.length ? html`<div class="panel" style=${{ marginTop: 12 }}>
        <div class="prog-label">${present} present of ${rows.length} recorded · ${pct}%</div>
        <div class="prog-bar"><i style=${{ width: (pct || 0) + "%" }}></i></div>
      </div>` : null}
      <div class="m-list" style=${{ marginTop: 12 }}>
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
    body = html`<${MyQueries} student=${student} /><${MessagesScreen} messages=${messages || []} student=${student} setSection=${setSection} />`;
  } else if (section === "transcript") {
    body = html`
      <${PageHead} title="Transcript" sub="Full published results" onBack=${() => setSection("grades")} backLabel="Grades" />
      <${TranscriptView} student=${student} grades=${grades || []} />
    `;
  } else if (section === "settings") {
    body = html`<${SettingsScreen} student=${student} user=${user} onLogout=${onLogout} setSection=${setSection} />`;
  } else {
    body = html`<${ProfileCard} student=${student} linked=${linked} name=${name} />`;
  }

  return html`<div class=${"m-app" + ((menuOpen || notifOpen) ? " is-locked" : "")}>
    <header class=${"m-top sticky-top" + (menuOpen || notifOpen ? " is-hidden" : "")}>
      <button class="icon-btn" aria-label="Open menu" aria-expanded=${menuOpen}
        onClick=${() => setMenuOpen(true)}>${Icon({ name: "menu", size: 18 })}</button>
      <div class="m-top-r">
        <button type="button" class="notif-btn" aria-label="Notifications" onClick=${() => setNotifOpen(true)}>
          ${Icon({ name: "bell", size: 18 })}
          ${unreadNotifs ? html`<span class="dot"></span>` : null}
        </button>
        <button type="button" class="avatar-btn" aria-label="Profile" onClick=${() => setSection("profile")}>
          <${Avatar} src=${student?.avatar} name=${name} />
        </button>
      </div>
    </header>
    <div class="m-scroll">
    ${body}
    </div>
    <footer class="careed-foot" aria-label="CareEd powered by CGTIA">
      <img src="/assets/brand/cgtia-logo.webp" alt="CGTIA" width="32" height="32" />
      <div class="careed-foot-text">
        <strong>CareEd</strong>
        <span>Powered by CGTIA</span>
      </div>
    </footer>
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
