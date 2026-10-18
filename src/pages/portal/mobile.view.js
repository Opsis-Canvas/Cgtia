
import { createElement, useCallback, useState } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { Avatar, Empty, StatusChip, ImageSlot } from "./shared.js";
import { ASSETS } from "./assets.js";
import { MenuDrawer } from "./drawer.view.js";

const html = htm.bind(createElement);
const TILE_TONE = { courses: "sky", grades: "lilac", fees: "mint" };

function Tile({ s }) {
  return html`<div class=${"m-tile " + (TILE_TONE[s.id] || "sky") + (s.tall ? " tall" : "")}>
    <span class="tile-icon">${Icon({ name: s.icon || "grid", size: 20 })}</span>
    <div>
      <div class="num">${s.value}${s.total != null ? html`<span>/${s.total}</span>` : null}</div>
      <div class="lbl">${s.label}</div>
    </div>
  </div>`;
}

function ListCard({ badge, title, note, tone }) {
  return html`<article class="m-card">
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
      ${(announcements || []).length ? html`<section class="ann-card">
        <h4>${announcements[0].title || "Announcement"}</h4>
        <p>${announcements[0].body || announcements[0].message || ""}</p>
      </section>` : null}
      <section class="m-tiles">
        ${stats.map((s) => html`<${Tile} key=${s.id} s=${s} />`)}
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
                note=${c.code || ""}
                tone=${i % 2 ? "mist" : "ink"} />`)
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
              note=${c.code || ""}
              tone=${i % 2 ? "mist" : "ink"} />`)
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
              note=${(a.dueDate ? "Due " + a.dueDate : "No due date") + (a.moduleCode ? " · " + a.moduleCode : "")}
              tone=${a.type === "exam" ? "coral" : a.type === "assignment" ? "lime" : "ink"} />`)
          : html`<${Empty} title="Nothing scheduled" body="When tests or assignments go live for your track, they will appear here." />`}
      </div>
    `;
  } else if (section === "fees") {
    body = html`
      <div class="page-head"><h1 class="display">Fees</h1><p>Payments for your email</p></div>
      <section class="m-tiles">
        <${Tile} s=${{ id: "fees", value: "₦" + (paidTotal >= 1000 ? Math.round(paidTotal / 1000) + "k" : paidTotal), label: "Total recorded", icon: "card", tall: true }} />
        <${Tile} s=${{ id: "courses", value: String(payments.length), label: "Transactions", icon: "grid" }} />
      </section>
      <div class="panel">
        ${payments.length
          ? payments.map((p) => html`<div class="m-card" style=${{ marginBottom: 8 }} key=${p.id}>
              <span class="badge tone-mist">₦</span>
              <div class="m-card-text">
                <h4>₦${Number(p.amountPaid || p.amount || 0).toLocaleString()}</h4>
                <p>${String(p.paidAt || p.createdAt || "").toString().slice(0, 10) || "—"}</p>
              </div>
              <${StatusChip} status=${p.status || "paid"} />
            </div>`)
          : html`<${Empty} title="No payments found" body="When a payment uses this email, it will show up here." />`}
      </div>
    `;
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
