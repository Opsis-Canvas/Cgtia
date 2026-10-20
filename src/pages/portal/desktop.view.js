
import { createElement } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { Avatar, Empty, NavList, StatusChip, ImageSlot, formatPayDate, money } from "./shared.js";
import { ASSETS } from "./assets.js";

const html = htm.bind(createElement);

function StatCard({ s }) {
  return html`<div class=${"stat stat-" + s.tone}>
    <div class="num">${s.value}${s.total != null ? html`<span>/${s.total}</span>` : null}</div>
    <div class="lbl">${s.label}</div>
  </div>`;
}

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

function CourseRow({ c, i, onOpen }) {
  return html`<div class="lesson is-click" role="button" onClick=${onOpen}>
    <span class=${"badge tone-" + (i % 2 ? "mist" : "ink")}>${String(i + 1).padStart(2, "0")}</span>
    <span class="lesson-text"><h4>${c.title || c.code}</h4><p>${c.code || "Open module"}</p></span>
    ${Icon({ name: "arrow", size: 18 })}
  </div>`;
}

function GradeRow({ g }) {
  return html`<div class="lesson">
    <span class="badge tone-lime">${g.grade || "·"}</span>
    <span class="lesson-text">
      <h4>${g.courseTitle || g.courseCode || "Course"}</h4>
      <p>${g.score != null ? "Score " + g.score : (g.remark || "Published")}</p>
    </span>
  </div>`;
}

export function DesktopView({ ctx }) {
  const {
    student, nav, section, setSection, stats, courses, grades, payments,
    paidTotal, onLogout, linked, announcements, assessments
  } = ctx;
  const name = student?.name || "Student";

  let main = null;
  if (section === "dashboard") {
    main = html`
      <section class="d-banner">
        <div class="d-banner-copy">
          <h2 class="display">${linked ? "Keep going" : "Almost there"}</h2>
          <p>${linked
            ? "Your courses and results update here when the academy publishes them."
            : "Sign-in works. Ask admissions to match this email to your student file so everything can load."}</p>
          <button type="button" class="pill-ink" onClick=${() => setSection(linked ? "courses" : "profile")}>
            ${linked ? "View courses" : "View profile"}
          </button>
        </div>
        <${ImageSlot} asset=${ASSETS.bannerPerson} variant="desktop" className="d-banner-img" />
      </section>
      <section class="stats">
        ${stats.map((s) => html`<${StatCard} key=${s.id} s=${s} />`)}
      </section>
      ${(announcements || []).length ? html`<section class="ann-card is-click" role="button"
        onClick=${() => setSection("notice:" + (announcements[0].id || "0"))}>
        <h4>${announcements[0].title || "Announcement"}</h4>
        <p>${(announcements[0].body || announcements[0].message || "").slice(0, 160)}</p>
        <div class="ann-meta">Tap for full details →</div>
      </section>` : null}
      <section class="d-cols">
        <div class="panel lessons" aria-label="Courses">
          <h3 class="display" style=${{ fontSize: 16, margin: "4px 10px 8px" }}>Your modules</h3>
          ${courses.length
            ? courses.slice(0, 6).map((c, i) => html`<${CourseRow} key=${c.id} c=${c} i=${i} onOpen=${() => setSection("course:" + c.id)} />`)
            : html`<${Empty} title="No modules yet" body="When your programme is linked, the modules for your track will show up here." />`}
          ${courses.length > 6
            ? html`<button type="button" class="see" style=${{ alignSelf: "flex-end", border: 0, background: "none", cursor: "pointer" }} onClick=${() => setSection("courses")}>see all</button>`
            : null}
        </div>
        <div class="stack">
          <div class="panel lessons">
            <h3 class="display" style=${{ fontSize: 16, margin: "4px 10px 8px" }}>Recent results</h3>
            ${grades.length
              ? grades.slice(0, 4).map((g) => html`<${GradeRow} key=${g.id} g=${g} />`)
              : html`<${Empty} title="No results yet" body="When a grade is published for you, it will appear here." />`}
            ${grades.length
              ? html`<button type="button" class="see" style=${{ alignSelf: "flex-end", border: 0, background: "none", cursor: "pointer" }} onClick=${() => setSection("grades")}>see all</button>`
              : null}
          </div>
          <div class="panel">
            <h3 class="display" style=${{ fontSize: 16, marginBottom: 10 }}>Fees snapshot</h3>
            <div class="num" style=${{ fontSize: 28 }}>₦${paidTotal.toLocaleString()}</div>
            <p style=${{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>Total recorded against your email</p>
          </div>
        </div>
      </section>
    `;
  } else if (section === "courses") {
    main = html`
      <div class="page-head"><h1 class="display">Courses</h1><p>Modules on your programme track</p></div>
      <div class="panel lessons">
        ${courses.length
          ? courses.map((c, i) => html`<${CourseRow} key=${c.id} c=${c} i=${i} onOpen=${() => setSection("course:" + c.id)} />`)
          : html`<${Empty} title="Nothing to show yet" body="Your course list appears after admissions links your programme. If you expected to see modules, message the office with your full name and email." />`}
      </div>
    `;
  } else if (section === "grades") {
    main = html`
      <div class="page-head"><h1 class="display">My grades</h1><p>Only published results are listed</p></div>
      <div class="panel">
        ${grades.length
          ? html`<table class="table-plain">
              <thead><tr><th>Course</th><th>Grade</th><th>Score</th></tr></thead>
              <tbody>
                ${grades.map((g) => html`<tr key=${g.id}>
                  <td><strong>${g.courseCode || ""}</strong> ${g.courseTitle || ""}</td>
                  <td>${g.grade || "—"}</td>
                  <td>${g.score != null ? g.score : "—"}</td>
                </tr>`)}
              </tbody>
            </table>`
          : html`<${Empty} title="No grades published" body="Instructors release results when they are ready. Check back after assessments — nothing is missing on your side." />`}
      </div>
    `;
  } else if (section === "assessments") {
    main = html`
      <div class="page-head"><h1 class="display">Tests & assignments</h1><p>What is live for your programme</p></div>
      <div class="panel lessons">
        ${(assessments || []).length
          ? assessments.map((a, i) => html`<div class="lesson" key=${a.id}>
              <span class=${"badge tone-" + (a.type === "exam" ? "coral" : a.type === "assignment" ? "lime" : "ink")}>${(a.type || "test").slice(0, 4)}</span>
              <span class="lesson-text">
                <h4>${a.title}</h4>
                <p>${a.dueDate ? "Due " + a.dueDate : "No due date"}${a.moduleCode ? " · " + a.moduleCode : ""}</p>
              </span>
            </div>`)
          : html`<${Empty} title="Nothing scheduled" body="When tests or assignments are published for your track, they will show up here." />`}
      </div>
    `;
  } else if (section === "fees") {
    main = html`
      <div class="page-head"><h1 class="display">Fees</h1><p>Payments tied to your sign-in email</p></div>
      <section class="stats">
        <${StatCard} s=${{ value: "₦" + paidTotal.toLocaleString(), label: "Total recorded", tone: "ink" }} />
        <${StatCard} s=${{ value: String(payments.length), label: "Transactions", tone: "mist" }} />
      </section>
      <div class="panel">
        ${payments.length
          ? html`<table class="table-plain">
              <thead><tr><th>When</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                ${payments.map((p) => html`<tr key=${p.id}>
                  <td>${String(p.paidAt || p.createdAt || "").toString().slice(0, 10) || "—"}</td>
                  <td>₦${Number(p.amountPaid || p.amount || 0).toLocaleString()}</td>
                  <td><${StatusChip} status=${p.status || "paid"} /></td>
                </tr>`)}
              </tbody>
            </table>`
          : html`<${Empty} title="No payments found" body="When a payment is made with this email, it will show up here. Cash receipts recorded by the office appear the same way." />`}
      </div>
    `;
  } else if (String(section || "").startsWith("notice:")) {
    const nid = String(section).slice(7);
    const n = (announcements || []).find((a) => String(a.id) === nid) || (announcements || [])[0];
    main = html`
      <div class="page-head">
        <button type="button" class="ghost-back" onClick=${() => setSection("dashboard")}>← Back</button>
        <h1 class="display">${n?.title || "Announcement"}</h1>
        <p>From the academy</p>
      </div>
      <div class="panel prose"><p>${n?.body || n?.message || "No further details."}</p></div>
    `;
  } else if (String(section || "").startsWith("course:")) {
    const cid = String(section).slice(7);
    const c = (courses || []).find((x) => x.id === cid);
    const lessons = Array.isArray(c?.lessons) ? c.lessons.slice().sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    main = html`
      <div class="page-head">
        <button type="button" class="ghost-back" onClick=${() => setSection("courses")}>← Courses</button>
        <h1 class="display">${c?.title || "Module"}</h1>
        <p>${c?.code || ""} · ${c?.program || ""}</p>
      </div>
      ${c?.description ? html`<div class="panel prose"><p>${c.description}</p></div>` : null}
      <div class="panel lessons" style=${{ marginTop: 12 }}>
        <h3 class="display" style=${{ fontSize: 16, margin: "4px 10px 8px" }}>Lessons</h3>
        ${lessons.length
          ? lessons.map((l, i) => html`<div class="lesson is-click" role="button" key=${l.id || i}
              onClick=${() => setSection("lesson:" + cid + ":" + (l.id || i))}>
              <span class=${"badge tone-" + (l.type === "video" ? "coral" : "sky")}>${String(i + 1).padStart(2, "0")}</span>
              <span class="lesson-text"><h4>${l.title || "Lesson"}</h4><p>${l.type || "text"}${l.duration ? " · " + l.duration : ""}</p></span>
              ${Icon({ name: "arrow", size: 18 })}
            </div>`)
          : html`<${Empty} title="No lessons yet" body="Your instructor will add videos and reading here." />`}
      </div>
    `;
  } else if (String(section || "").startsWith("lesson:")) {
    const parts = String(section).slice(7).split(":");
    const cid = parts[0];
    const lid = parts[1];
    const c = (courses || []).find((x) => x.id === cid);
    const lessons = Array.isArray(c?.lessons) ? c.lessons : [];
    const l = lessons.find((x, i) => String(x.id || i) === String(lid)) || lessons[Number(lid)] || null;
    main = html`
      <div class="page-head">
        <button type="button" class="ghost-back" onClick=${() => setSection("course:" + cid)}>← Module</button>
        <h1 class="display">${l?.title || "Lesson"}</h1>
        <p>${l?.type || "text"}</p>
      </div>
      <div class="panel prose">
        ${l?.type === "video" && l?.videoUrl
          ? html`<div class="video-wrap"><iframe src=${toEmbed(l.videoUrl)} title=${l.title || "Video"} allowfullscreen loading="lazy"></iframe></div>`
          : null}
        ${l?.body ? html`<div class="lesson-body">${l.body}</div>` : html`<p class="muted">No content text for this lesson yet.</p>`}
        ${l?.ttsText || l?.body
          ? html`<button type="button" class="pill-ink" style=${{ marginTop: 12 }} onClick=${() => {
              try {
                const u = new SpeechSynthesisUtterance(l.ttsText || l.body || "");
                u.lang = "en-NG";
                speechSynthesis.cancel();
                speechSynthesis.speak(u);
              } catch (_) {}
            }}>Listen (text to speech)</button>`
          : null}
      </div>
    `;
  } else if (String(section || "").startsWith("test:")) {
    const tid = String(section).slice(5);
    const a = (assessments || []).find((x) => x.id === tid);
    main = html`
      <div class="page-head">
        <button type="button" class="ghost-back" onClick=${() => setSection("assessments")}>← Tests</button>
        <h1 class="display">${a?.title || "Test"}</h1>
        <p>Open this test on your phone for the full timed experience, or use the mobile layout.</p>
      </div>
      <div class="panel">
        <p>${a?.description || "No description."}</p>
        <p style=${{ marginTop: 8, color: "var(--muted)" }}>${(a?.questions || []).length} question(s)${a?.timerMinutes ? " · " + a.timerMinutes + " min" : ""}</p>
      </div>
    `;
  } else {
    main = html`
      <div class="page-head"><h1 class="display">Profile</h1><p>How the academy has you on file</p></div>
      <div class="panel" style=${{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
        <${Avatar} src=${student?.avatar} name=${name} size=${72} />
        <div>
          <h2 class="display" style=${{ fontSize: 22 }}>${name}</h2>
          <p style=${{ color: "var(--muted)", marginTop: 4 }}>${student?.email || ""}</p>
        </div>
      </div>
      <div class="panel" style=${{ marginTop: 16 }}>
        <table class="table-plain">
          <tbody>
            <tr><td>Reg number</td><td><strong>${student?.reg || "—"}</strong></td></tr>
            <tr><td>Programme</td><td><strong>${student?.program || "—"}</strong></td></tr>
            <tr><td>Cohort</td><td><strong>${student?.cohort || "—"}</strong></td></tr>
            <tr><td>Status</td><td><strong>${student?.status || "—"}</strong></td></tr>
            <tr><td>Phone</td><td><strong>${student?.phone || "—"}</strong></td></tr>
            <tr><td>Start date</td><td><strong>${student?.startDate || "—"}</strong></td></tr>
            <tr><td>Certificate code</td><td><strong>${student?.certificateCode || "—"}</strong></td></tr>
            <tr><td>Next of kin</td><td><strong>${student?.nextOfKin || "—"}</strong></td></tr>
            <tr><td>Profile form</td><td><strong>${student?.profileCompleted ? "Completed" : "Not completed yet"}</strong></td></tr>
          </tbody>
        </table>
        ${!linked
          ? html`<${Empty} title="Student file not linked" body="Your login is fine. Ask admissions to put this exact email on your student record so reg number, programme, and results can load." />`
          : html`<p style=${{ color: "var(--muted)", fontSize: 13, marginTop: 12 }}>Legal details such as NIN are held by the academy. Contact the office to update them.</p>`}
      </div>
    `;
  }

  return html`<div class="d-shell">
    <aside class="d-side">
      <div class="logo careed-brand"><img src="/assets/brand/cgtia-logo.webp" alt="" width="28" height="28" style="width:28px;height:28px;object-fit:contain" /><span>CGTIA</span></div>
      <div class="profile">
        <${Avatar} src=${student?.avatar} name=${name} size=${58} />
        <h2>${name}</h2>
        <p>${student?.role || "Student"}</p>
      </div>
      <nav class="d-nav" aria-label="Main">
        <${NavList} items=${nav} active=${section} onSelect=${setSection} />
        <button type="button" onClick=${onLogout} style=${{ marginTop: 12 }}>
          ${Icon({ name: "logout", size: 18 })}<span>Log out</span>
        </button>
      </nav>
    </aside>
    <main class="d-main">${main}</main>
  </div>`;
}
