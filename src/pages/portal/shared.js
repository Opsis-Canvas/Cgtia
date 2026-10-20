
import { createElement } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
const html = htm.bind(createElement);

export function Empty({ title, body }) {
  return html`<div class="empty">
    <h4>${title}</h4>
    <p>${body}</p>
  </div>`;
}

export function StatusChip({ status }) {
  const s = String(status || "").toLowerCase();
  let cls = "chip-status";
  if (/paid|complete|pass|active|ok/.test(s)) cls += " ok";
  else if (/pend|due|partial/.test(s)) cls += " warn";
  return html`<span class=${cls}>${status || "—"}</span>`;
}

export function NavList({ items, active, onSelect, buttonClass }) {
  return items.map((n) => html`
    <button key=${n.id} type="button"
      class=${(buttonClass || "") + (active === n.id ? " on" : "")}
      onClick=${() => onSelect(n.id)}>
      ${Icon({ name: n.icon, size: 18 })}<span>${n.label}</span>
    </button>
  `);
}

export function Avatar({ src, name, size }) {
  const initial = String(name || "S").charAt(0).toUpperCase();
  if (src) return html`<img class="avatar" src=${src} alt="" style=${size ? { width: size, height: size } : undefined} />`;
  return html`<div class="avatar" style=${{
    width: size || 40, height: size || 40, background: "var(--mist)",
    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14
  }}>${initial}</div>`;
}

/** PNG slot — exact box from assets.js; dashed placeholder until url is set */
export function ImageSlot({ asset, variant = "mobile", className = "" }) {
  if (!asset) return null;
  const box = asset[variant] || asset.mobile || {};
  const style = {};
  for (const k of ["width", "height", "left", "right", "top", "bottom"]) {
    if (box[k] !== undefined) style[k] = typeof box[k] === "number" ? box[k] + "px" : box[k];
  }
  if (asset.url) {
    return html`<img class=${"slot-img " + className} style=${style} src=${asset.url} alt=${asset.alt || ""} />`;
  }
  return html`<div class=${"slot is-empty " + className} style=${style} role="img" aria-label=${asset.alt || asset.name}>
    <span><b>${asset.name}</b><br />${box.width}×${box.height}</span>
  </div>`;
}

export function Skeleton({ rows = 3 }) {
  return html`<div class="skel-wrap" aria-hidden="true">
    <div class="skel skel-banner"></div>
    <div class="skel-row">
      <div class="skel skel-tile"></div>
      <div class="skel skel-tile"></div>
      <div class="skel skel-tile"></div>
    </div>
    ${Array.from({ length: rows }, (_, i) => html`<div key=${i} class="skel skel-line"></div>`)}
  </div>`;
}


export function formatPayDate(v) {
  if (!v) return "—";
  try {
    if (typeof v.toDate === "function") return v.toDate().toLocaleString();
    if (v.seconds) return new Date(v.seconds * 1000).toLocaleString();
    if (typeof v === "number") return new Date(v).toLocaleString();
    const s = String(v);
    if (s.startsWith("Timestamp")) return "—";
    const d = new Date(s);
    if (!Number.isNaN(d.getTime())) return d.toLocaleString();
    return s.slice(0, 16);
  } catch (_) { return "—"; }
}

export function money(n) {
  const x = Number(n) || 0;
  return "₦" + x.toLocaleString("en-NG");
}


/** Lesson progress — local until we sync to Firestore */
export function progressKey(email, courseId) {
  return "cgtia_prog_" + String(email || "anon").toLowerCase() + "_" + String(courseId || "");
}

export function loadProgress(email, courseId) {
  try {
    const raw = localStorage.getItem(progressKey(email, courseId));
    if (!raw) return { completed: [], lastLessonId: null, modulePassed: false };
    const j = JSON.parse(raw);
    return {
      completed: Array.isArray(j.completed) ? j.completed : [],
      lastLessonId: j.lastLessonId || null,
      modulePassed: !!j.modulePassed
    };
  } catch (_) {
    return { completed: [], lastLessonId: null, modulePassed: false };
  }
}

export function saveProgress(email, courseId, data) {
  try {
    localStorage.setItem(progressKey(email, courseId), JSON.stringify({
      completed: data.completed || [],
      lastLessonId: data.lastLessonId || null,
      modulePassed: !!data.modulePassed,
      updatedAt: Date.now()
    }));
  } catch (_) {}
}

export function setModulePassed(email, courseId, passed) {
  const p = loadProgress(email, courseId);
  p.modulePassed = !!passed;
  saveProgress(email, courseId, p);
  return p;
}

export function markLessonDone(email, courseId, lessonId) {
  const p = loadProgress(email, courseId);
  const id = String(lessonId);
  if (!p.completed.includes(id)) p.completed.push(id);
  p.lastLessonId = id;
  saveProgress(email, courseId, p);
  return p;
}


/** WhatsApp-style markers → safe HTML fragments (no raw HTML from authors) */
export function formatInline(text) {
  let s = String(text || "");
  s = s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  // code ```...```
  s = s.replace(/```([\s\S]*?)```/g, (_, c) => "<code class=\"ls-code\">" + c + "</code>");
  // bold *...*
  s = s.replace(/\*([^*]+)\*/g, "<strong>$1</strong>");
  // italic _..._
  s = s.replace(/_([^_]+)_/g, "<em>$1</em>");
  // strike ~...~
  s = s.replace(/~([^~]+)~/g, "<del>$1</del>");
  return s;
}

/**
 * Render lesson body into block HTML.
 * Supports:
 *   # Header / ## Subheader
 *   WhatsApp *bold* _italic_ ~strike~
 *   Tables: lines with | col | col |
 *   blocks[]: { type: h1|h2|p|table|list, text|rows }
 */
export function formatLessonHtml(lesson) {
  if (!lesson) return "";
  const parts = [];
  if (lesson.header) {
    parts.push("<h2 class=\"ls-h1\">" + formatInline(lesson.header) + "</h2>");
  }
  if (lesson.subheader) {
    parts.push("<h3 class=\"ls-h2\">" + formatInline(lesson.subheader) + "</h3>");
  }
  if (Array.isArray(lesson.blocks) && lesson.blocks.length) {
    lesson.blocks.forEach((b) => {
      const t = (b.type || "p").toLowerCase();
      if (t === "h1" || t === "header") parts.push("<h2 class=\"ls-h1\">" + formatInline(b.text || b.content || "") + "</h2>");
      else if (t === "h2" || t === "subheader") parts.push("<h3 class=\"ls-h2\">" + formatInline(b.text || b.content || "") + "</h3>");
      else if (t === "list" && Array.isArray(b.items)) {
        parts.push("<ul class=\"ls-list\">" + b.items.map((it) => "<li>" + formatInline(it) + "</li>").join("") + "</ul>");
      } else if (t === "table" && Array.isArray(b.rows)) {
        const rows = b.rows.map((row, ri) => {
          const cells = (Array.isArray(row) ? row : String(row).split("|")).map((c) => c.trim());
          const tag = ri === 0 ? "th" : "td";
          return "<tr>" + cells.map((c) => "<" + tag + ">" + formatInline(c) + "</" + tag + ">").join("") + "</tr>";
        }).join("");
        parts.push("<div class=\"ls-table-wrap\"><table class=\"ls-table\">" + rows + "</table></div>");
      } else {
        parts.push("<p class=\"ls-p\">" + formatInline(b.text || b.content || "") + "</p>");
      }
    });
    return parts.join("");
  }
  const body = String(lesson.body || lesson.ttsText || "");
  if (!body.trim()) return parts.join("");
  const lines = body.replace(/\r\n/g, "\n").split("\n");
  let buf = [];
  const flushP = () => {
    const t = buf.join(" ").trim();
    if (t) parts.push("<p class=\"ls-p\">" + formatInline(t) + "</p>");
    buf = [];
  };
  let tableBuf = [];
  const flushTable = () => {
    if (!tableBuf.length) return;
    const rows = tableBuf.map((line) => line.split("|").map((c) => c.trim()).filter((c, i, a) => !(i === 0 && c === "") && !(i === a.length - 1 && c === "")));
    // filter separator rows ---
    const clean = rows.filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
    if (clean.length) {
      const htmlRows = clean.map((cells, ri) => {
        const tag = ri === 0 ? "th" : "td";
        return "<tr>" + cells.map((c) => "<" + tag + ">" + formatInline(c) + "</" + tag + ">").join("") + "</tr>";
      }).join("");
      parts.push("<div class=\"ls-table-wrap\"><table class=\"ls-table\">" + htmlRows + "</table></div>");
    }
    tableBuf = [];
  };
  lines.forEach((raw) => {
    const line = raw.trimEnd();
    const t = line.trim();
    if (!t) { flushTable(); flushP(); return; }
    if (t.includes("|") && t.indexOf("|") !== t.lastIndexOf("|")) {
      flushP();
      tableBuf.push(t);
      return;
    }
    flushTable();
    if (t.startsWith("## ")) { flushP(); parts.push("<h3 class=\"ls-h2\">" + formatInline(t.slice(3)) + "</h3>"); return; }
    if (t.startsWith("# ")) { flushP(); parts.push("<h2 class=\"ls-h1\">" + formatInline(t.slice(2)) + "</h3>".replace("h3","h2")); parts[parts.length-1] = "<h2 class=\"ls-h1\">" + formatInline(t.slice(2)) + "</h2>"; return; }
    if (/^[-*•]\s+/.test(t)) {
      flushP();
      // collect list later simply as paragraph with bullet for now
      parts.push("<p class=\"ls-p ls-bullet\">" + formatInline(t.replace(/^[-*•]\s+/, "• ")) + "</p>");
      return;
    }
    buf.push(t);
  });
  flushTable();
  flushP();
  return parts.join("");
}
