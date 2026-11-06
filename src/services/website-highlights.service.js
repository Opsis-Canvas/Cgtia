// Highlights on the main website: designs and cards from the dashboard carousel, and stories,
// for items the admin marked "Also show on the main website". Manual carousel (no auto-advance),
// visible Previous and Next buttons, "2 of 4" position, keyboard friendly.
import { getFirebase } from "./firebase.service.js";

let cache = null;
let loading = null;

const esc = (t) => String(t == null ? "" : t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const safeUrl = (u) => { const s = String(u || "").trim(); return /^(https?:\/\/|\/)/.test(s) ? s : ""; };
const reduceMotion = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function styleAttr(st) {
  if (!st || typeof st !== "object") return "";
  const parts = [];
  if (st.size) parts.push("font-size:" + Number(st.size) + "px");
  if (st.weight) parts.push("font-weight:" + Number(st.weight));
  if (st.lineHeight) parts.push("line-height:" + Number(st.lineHeight));
  if (st.letterSpacing !== undefined) parts.push("letter-spacing:" + Number(st.letterSpacing) + "px");
  if (st.wordSpacing !== undefined) parts.push("word-spacing:" + Number(st.wordSpacing) + "px");
  return parts.length ? ' style="' + parts.join(";") + '"' : "";
}

async function loadItems() {
  if (cache) return cache;
  if (loading) return loading;
  loading = (async () => {
    try {
      const { db, api } = await getFirebase();
      const q = (name) => api.getDocs(api.query(api.collection(db, name), api.where("showOnWebsite", "==", true), api.where("active", "==", true)));
      const [a, b] = await Promise.all([q("dashboardSlides"), q("stories")]);
      const rows = (snap) => {
        const out = [];
        snap.forEach((d) => out.push({ id: d.id, ...d.data() }));
        return out.sort((x, y) => (Number(x.order) || 0) - (Number(y.order) || 0));
      };
      cache = { slides: rows(a), stories: rows(b) };
    } catch (e) {
      cache = { slides: [], stories: [] };
    }
    return cache;
  })();
  return loading;
}

function slideHtml(s, i, total) {
  const link = safeUrl(s.ctaUrl || s.linkUrl);
  const label = esc(s.ctaLabel || s.linkLabel || "Learn more");
  let inner;
  if (s.kind === "card") {
    inner = '<div class="hl-card"><h3>' + esc(s.title) + "</h3>" +
      (s.body ? "<p" + styleAttr(s.bodyStyle) + ">" + esc(s.body) + "</p>" : "") +
      (link ? '<a class="hl-btn" href="' + esc(link) + '">' + label + "</a>" : "") + "</div>";
  } else {
    const m = safeUrl(s.imageMobile), d = safeUrl(s.imageDesktop);
    const img = '<picture>' + (d ? '<source media="(min-width: 860px)" srcset="' + esc(d) + '">' : "") +
      '<img src="' + esc(m || d) + '" alt="' + esc(s.title || "Highlight") + '" loading="lazy"></picture>';
    inner = link ? '<a href="' + esc(link) + '" aria-label="' + esc(s.title || "Open highlight") + '">' + img + "</a>" : img;
  }
  return '<article class="hl-slide" role="group" aria-roledescription="slide" aria-label="' + (i + 1) + " of " + total + '">' + inner + "</article>";
}

function openViewer(list, start, opener) {
  let i = start;
  const el = document.createElement("div");
  el.className = "hl-viewer";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.setAttribute("aria-label", "Story");
  const prevOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
  function paint() {
    const s = list[i];
    const url = esc(safeUrl(s.mediaUrl));
    const media = s.kind === "video"
      ? '<video class="hl-viewer-media" src="' + url + '" controls playsinline></video>'
      : '<img class="hl-viewer-media" src="' + url + '" alt="' + esc(s.title || "Story") + '">';
    const link = safeUrl(s.linkUrl);
    el.innerHTML = '<div class="hl-viewer-box">' + media +
      (s.caption ? '<p class="hl-viewer-cap"' + styleAttr(s.captionStyle) + ">" + esc(s.caption) + "</p>" : "") +
      (link ? '<a class="hl-btn" href="' + esc(link) + '">' + esc(s.linkLabel || "Open") + "</a>" : "") +
      '<div class="hl-viewer-ctrl"><button type="button" class="hl-arrow" data-act="prev" aria-label="Previous story">‹</button>' +
      '<span class="hl-count">' + (i + 1) + " of " + list.length + '</span>' +
      '<button type="button" class="hl-arrow" data-act="next" aria-label="Next story">›</button></div>' +
      '<button type="button" class="hl-arrow hl-viewer-close" data-act="close" aria-label="Close">×</button></div>';
    const c = el.querySelector('[data-act="close"]');
    if (c) c.focus();
  }
  function close() {
    el.remove();
    document.body.style.overflow = prevOverflow;
    document.removeEventListener("keydown", onKey);
    if (opener && opener.focus) opener.focus();
  }
  function go(d) { i = (i + d + list.length) % list.length; paint(); }
  function onKey(e) {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowRight") go(1);
    else if (e.key === "ArrowLeft") go(-1);
  }
  el.addEventListener("click", (e) => {
    const a = e.target.closest("[data-act]");
    if (a) { const act = a.getAttribute("data-act"); if (act === "close") close(); else go(act === "next" ? 1 : -1); }
    else if (e.target === el) close();
  });
  document.addEventListener("keydown", onKey);
  document.body.appendChild(el);
  paint();
}

export async function renderWebsiteHighlights() {
  const mount = document.getElementById("siteHighlights");
  if (!mount || mount.getAttribute("data-ready") === "1") return;
  mount.setAttribute("data-ready", "1");
  const { slides, stories } = await loadItems();
  const feature = slides.filter((s) => s.kind === "card" ? (s.title || s.body) : (s.imageMobile || s.imageDesktop));
  const strip = stories.filter((s) => safeUrl(s.mediaUrl));
  if (!feature.length && !strip.length) { mount.innerHTML = ""; return; }

  let h = '<section class="hl-wrap" aria-label="Highlights">';
  if (strip.length) {
    h += '<div class="hl-stories" role="list">' + strip.map((s, i) => {
      const u = esc(safeUrl(s.mediaUrl));
      const thumb = s.kind === "video" ? '<video src="' + u + '#t=0.5" muted playsinline preload="metadata"></video>' : '<img src="' + u + '" alt="" loading="lazy">';
      return '<button type="button" class="hl-story" role="listitem" data-story="' + i + '" aria-label="Open story: ' + esc(s.title || "Story " + (i + 1)) + '"><span class="hl-story-ring"><span>' + thumb + "</span></span><small>" + esc(s.title || "") + "</small></button>";
    }).join("") + "</div>";
  }
  if (feature.length) {
    h += '<div class="hl-carousel" aria-roledescription="carousel" aria-label="Highlights"><div class="hl-track" tabindex="0">' +
      feature.map((s, i) => slideHtml(s, i, feature.length)).join("") + "</div>";
    if (feature.length > 1) {
      h += '<div class="hl-ctrl"><button type="button" class="hl-arrow" data-hl="prev" aria-label="Previous highlight">‹</button>' +
        '<span class="hl-count" aria-live="polite">1 of ' + feature.length + '</span><div class="hl-dots">' +
        feature.map((_, i) => '<button type="button" class="hl-dot" data-dot="' + i + '" aria-label="Show highlight ' + (i + 1) + '"' + (i === 0 ? ' aria-current="true"' : "") + "></button>").join("") +
        '</div><button type="button" class="hl-arrow" data-hl="next" aria-label="Next highlight">›</button></div>';
    }
    h += "</div>";
  }
  h += "</section>";
  mount.innerHTML = h;

  mount.querySelectorAll("[data-story]").forEach((b) => b.addEventListener("click", () => openViewer(strip, Number(b.getAttribute("data-story")), b)));
  const track = mount.querySelector(".hl-track");
  if (track && feature.length > 1) {
    const count = mount.querySelector(".hl-count");
    const dots = mount.querySelectorAll(".hl-dot");
    const index = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    const goTo = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: reduceMotion() ? "auto" : "smooth" });
    track.addEventListener("scroll", () => {
      const i = Math.min(feature.length - 1, Math.max(0, index()));
      count.textContent = (i + 1) + " of " + feature.length;
      dots.forEach((d, k) => { if (k === i) d.setAttribute("aria-current", "true"); else d.removeAttribute("aria-current"); });
    }, { passive: true });
    mount.querySelector('[data-hl="prev"]').addEventListener("click", () => goTo(Math.max(0, index() - 1)));
    mount.querySelector('[data-hl="next"]').addEventListener("click", () => goTo(Math.min(feature.length - 1, index() + 1)));
    dots.forEach((d) => d.addEventListener("click", () => goTo(Number(d.getAttribute("data-dot")))));
  }
}
