
import { createElement, useCallback, useState, useEffect } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { Avatar, Empty, StatusChip, ImageSlot, formatPayDate, money, loadProgress, markLessonDone } from "./shared.js";
import { ASSETS } from "./assets.js";
import { MenuDrawer } from "./drawer.view.js";

const html = htm.bind(createElement);
const TILE_TONE = { courses: "sky", grades: "lilac", fees: "mint" };

function BackBtn({ label, onClick }) {
  return html`<button type="button" class="icon-back-btn" onClick=${onClick}>
    <span aria-hidden="true" style=${{ fontSize: 18, lineHeight: 1 }}>←</span>
    <span>${label || "Back"}</span>
  </button>`;
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
    return html`<div class="page-head">
      <${BackBtn} label="Module" onClick=${() => setSection("course:" + cid)} />
      <h1 class="display">Lesson</h1>
    </div><${Empty} title="Not found" body="This lesson is unavailable." />`;
  }

  const unlocked = idx === 0 || loadProgress(student?.email, cid).completed.includes(String(lessons[idx - 1].id || (idx - 1)));
  if (!unlocked) {
    return html`<div class="page-head">
      <${BackBtn} label="Lessons" onClick=${() => setSection("course:" + cid + ":lessons")} />
      <h1 class="display">${l.title}</h1>
    </div><${Empty} title="Locked" body="Finish the previous lesson before opening this one." />`;
  }

  function completeAndNext() {
    markLessonDone(student?.email, cid, l.id != null ? l.id : idx);
    if (idx + 1 < lessons.length) {
      setSection("lesson:" + cid + ":" + (lessons[idx + 1].id != null ? lessons[idx + 1].id : (idx + 1)));
    } else {
      setSection("course:" + cid + ":lessons");
    }
  }

  return html`<div>
    <div class="page-head">
      <${BackBtn} label="Lessons" onClick=${() => setSection("course:" + cid + ":lessons")} />
      <h1 class="display">${l.title || "Lesson"}</h1>
      <p>${l.type || "text"} · ${idx + 1} of ${lessons.length}</p>
    </div>
    <div class="lesson-scroll">
      <div class="lesson-fade-top"></div>
      <div class="panel prose">
        ${l.type === "video" && l.videoUrl
          ? html`<div class="video-wrap"><iframe src=${toEmbed(l.videoUrl)} title=${l.title || "Video"} allowfullscreen loading="lazy"></iframe></div>`
          : null}
        ${l.body ? html`<div class="lesson-body">${l.body}</div>` : html`<p class="muted">No reading text for this lesson yet.</p>`}
      </div>
      <div class=${"tts-dock" + (ttsHide ? " hide" : "")}>
        ${l.ttsText || l.body
          ? html`<button type="button" class="pill-ink" onClick=${() => {
              try {
                const u = new SpeechSynthesisUtterance(l.ttsText || l.body || "");
                u.lang = "en-NG";
                speechSynthesis.cancel();
                speechSynthesis.speak(u);
              } catch (_) {}
            }}>Listen</button>`
          : null}
      </div>
    </div>
    <div style=${{ padding: "12px 0 80px", display: "flex", gap: 8, flexWrap: "wrap" }}>
      <button type="button" class="pill-ink" onClick=${completeAndNext}>
        ${idx + 1 < lessons.length ? "Mark done · Next" : "Mark done · Finish"}
      </button>
    </div>
    <button type="button" class="fab-lessons" aria-label="Lesson list" onClick=${() => setNavOpen(true)}>☰</button>
    ${navOpen ? html`
      <div class="lesson-nav-backdrop" onClick=${() => setNavOpen(false)}></div>
      <div class="lesson-nav-sheet">
        <h4>Lessons in this module</h4>
        ${lessons.map((ls, i) => {
          const id = String(ls.id != null ? ls.id : i);
          const prog = loadProgress(student?.email, cid);
          const open = i === 0 || prog.completed.includes(String(lessons[i - 1].id != null ? lessons[i - 1].id : (i - 1)));
          return html`<button type="button" key=${id} class="icon-back-btn" style=${{ display: "flex", width: "100%", padding: "10px 0", opacity: open ? 1 : 0.45 }}
            disabled=${!open}
            onClick=${() => { setNavOpen(false); if (open) setSection("lesson:" + cid + ":" + id); }}>
            ${String(i + 1).padStart(2, "0")} · ${ls.title || "Lesson"}${prog.completed.includes(id) ? " ✓" : ""}
          </button>`;
        })}
      </div>
    ` : null}
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

function ListCard({ badge, title, note, tone, onClick }) {
  return html`<article class=${"m-card" + (onClick ? " is-click" : "")} role=${onClick ? "button" : undefined} onClick=${onClick}>
    <span class=${"badge tone-" + (tone || "mist")}>${badge}</span>
    <div class="m-card-text">
      <h4>${title}</h4>
      <p>${note || ""}</p>
    </div>
  </article>`;
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
  } else if (section === "fees" || String(section || "").startsWith("fees:")) {
    const feeFilter = String(section).startsWith("fees:") ? String(section).slice(5) : "all";
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
      if (feeFilter === "all") return true;
      if (feeFilter === "paid") return /paid|complete/.test(st);
      if (feeFilter === "pending") return /pend|partial/.test(st);
      if (feeFilter === "failed") return /fail|unpaid|cancel/.test(st);
      if (feeFilter === "tuition") return /tuition|cert|diploma|program/.test(blob);
      if (feeFilter === "id-card") return /id.?card|student id/.test(blob);
      return true;
    });
    body = html`
      <div class="page-head">
        <h1 class="display">Fees</h1>
        <p>Payments for your email</p>
      </div>
      <section class="m-tiles">
        <${Tile} s=${{ id: "fees", value: "₦" + (paidTotal >= 1000 ? Math.round(paidTotal / 1000) + "k" : paidTotal), label: "Total recorded", icon: "card", tall: true }}
          onClick=${() => setSection("fees:all")} />
        <${Tile} s=${{ id: "tx", value: String(payments.length), label: "Transactions", icon: "grid" }}
          onClick=${() => setSection("fees:all")} />
      </section>
      <div class="filter-chips">
        ${filters.map((f) => html`<button type="button" key=${f.id} class=${feeFilter === f.id ? "on" : ""}
          onClick=${() => setSection("fees:" + f.id)}>${f.label}</button>`)}
      </div>
      <div class="panel">
        ${filtered.length
          ? filtered.map((p) => html`<div class="m-card is-click" style=${{ marginBottom: 8 }} key=${p.id}
              role="button" onClick=${() => setSection("receipt:" + p.id)}>
              <span class="badge tone-mist">₦</span>
              <div class="m-card-text">
                <h4>${p.feeName || p.purpose || p.feeType || p.program || "Payment"} · ${money(p.amountPaid || p.amount)}</h4>
                <p>${formatPayDate(p.paidAt || p.createdAt)}${p.method || p.channel ? " · " + (p.method || p.channel) : ""}</p>
                <p style=${{ fontSize: 11, marginTop: 4, wordBreak: "break-all" }}>Ref: ${p.reference || p.paystackReference || p.id || "—"}</p>
              </div>
              <${StatusChip} status=${p.paymentStatus || p.status || "pending"} />
            </div>`)
          : html`<${Empty} title="No payments in this filter" body="Try All, or complete a payment with a fee link." />`}
      </div>
    `;
  } else if (String(section || "").startsWith("receipt:")) {
    const rid = String(section).slice(8);
    const pmt = (payments || []).find((x) => x.id === rid);
    body = html`
      <div class="page-head">
        <${BackBtn} label="Fees" onClick=${() => setSection("fees:all")} />
        <h1 class="display">Receipt</h1>
        <p>Payment details</p>
      </div>
      ${!pmt ? html`<${Empty} title="Not found" body="This payment is no longer available." />` : html`
        <div class="receipt-sheet">
          <div class="receipt-hero">
            <div class="sub">CGTIA · ${pmt.feeName || pmt.purpose || pmt.feeType || "Payment"}</div>
            <div class="amt">${money(pmt.amountPaid || pmt.amount)}</div>
            <div class="sub">${String(pmt.paymentStatus || pmt.status || "paid").toUpperCase()}</div>
          </div>
          <div class="panel">
            <div class="receipt-row"><span>Status</span><span>${pmt.paymentStatus || pmt.status || "—"}</span></div>
            <div class="receipt-row"><span>Date</span><span>${formatPayDate(pmt.paidAt || pmt.createdAt)}</span></div>
            <div class="receipt-row"><span>Method</span><span>${pmt.method || pmt.channel || "—"}</span></div>
            <div class="receipt-row"><span>Reference</span><span>${pmt.reference || pmt.paystackReference || pmt.id}</span></div>
            <div class="receipt-row"><span>Email</span><span>${pmt.email || student?.email || "—"}</span></div>
            <div class="receipt-row"><span>Name</span><span>${pmt.fullName || student?.name || "—"}</span></div>
            ${pmt.regNumber ? html`<div class="receipt-row"><span>Reg number</span><span>${pmt.regNumber}</span></div>` : null}
          </div>
        </div>
      `}
    `;
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
        <div class="page-head">
          <${BackBtn} label="Courses" onClick=${() => setSection("courses")} />
          <h1 class="display">${c?.title || "Module"}</h1>
          <p>${c?.code || ""} · ${c?.program || ""}</p>
        </div>
        <div class="course-hero-art">
          ${c?.coverUrl
            ? html`<img src=${c.coverUrl} alt="" />`
            : html`<div class="ph"><strong>Module cover</strong><br/>Illustration placeholder (.webp)<br/>${lessons.length} lesson${lessons.length === 1 ? "" : "s"}</div>`}
        </div>
        <div class="panel">
          <div class="prog-label">${doneN} of ${lessons.length} lessons done · ${pct}%</div>
          <div class="prog-bar"><i style=${{ width: pct + "%" }}></i></div>
          <p style=${{ marginTop: 12, fontSize: 14, lineHeight: 1.5 }}>${c?.description || "No description yet."}</p>
          <div style=${{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            <button type="button" class="pill-ink" onClick=${() => setSection("course:" + cid + ":lessons")}>
              ${doneN > 0 ? "Continue learning" : "Start lessons"}
            </button>
            ${resumeId && lessons[nextIdx]
              ? html`<button type="button" class="icon-back-btn" style=${{ justifyContent: "center" }}
                  onClick=${() => setSection("lesson:" + cid + ":" + (lessons[nextIdx].id != null ? lessons[nextIdx].id : nextIdx))}>
                  Resume: ${lessons[nextIdx].title || "last lesson"}
                </button>`
              : null}
          </div>
        </div>
      `;
    } else {
      body = html`
        <div class="page-head">
          <${BackBtn} label="Overview" onClick=${() => setSection("course:" + cid)} />
          <h1 class="display">Lessons</h1>
          <p>${c?.title || ""} · ${pct}% complete</p>
        </div>
        <div class="panel" style=${{ marginBottom: 12 }}>
          <div class="prog-bar"><i style=${{ width: pct + "%" }}></i></div>
          <div class="prog-label">${doneN}/${lessons.length} complete · open in order (no skipping)</div>
        </div>
        <div class="m-list">
          ${lessons.length
            ? lessons.map((l, i) => {
                const id = String(l.id != null ? l.id : i);
                const unlocked = i === 0 || prog.completed.includes(String(lessons[i - 1].id != null ? lessons[i - 1].id : (i - 1)));
                const done = prog.completed.includes(id);
                return html`<${ListCard} key=${id}
                  badge=${done ? "✓" : String(i + 1).padStart(2, "0")}
                  title=${l.title || "Lesson"}
                  note=${!unlocked ? "Locked — finish the previous lesson first" : ((l.type || "text") + (l.duration ? " · " + l.duration : "") + (done ? " · Done" : ""))}
                  tone=${!unlocked ? "mist" : (l.type === "video" ? "coral" : "sky")}
                  onClick=${unlocked ? () => setSection("lesson:" + cid + ":" + id) : undefined} />`;
              })
            : html`<${Empty} title="No lessons yet" body="Your instructor will add videos and reading here." />`}
        </div>
      `;
    }
  } else if (String(section || "").startsWith("lesson:")) {
    body = html`<${LessonView} section=${section} courses=${courses} student=${student} setSection=${setSection} />`;
  } else if (String(section || "").startsWith("test:")) {
    const tid = String(section).slice(5);
    const a = (assessments || []).find((x) => x.id === tid);
    const qs = Array.isArray(a?.questions) ? a.questions : [];
    body = html`<${TakeTest} assessment=${a} questions=${qs} onBack=${() => setSection("assessments")} />`;
  }
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
