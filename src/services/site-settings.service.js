import { renderProgramCards } from "./tuition-cards.service.js";
/**
 * Load admin-controlled site settings: cohort label, year, program start dates & modality
 */
import { getFirebase } from "./firebase.service.js";

const DEFAULT_PROGRAMS = {
  certificate: {
    name: "CGTIA Certificate",
    startDate: "To be announced",
    modality: "Online and in person"
  },
  diploma: {
    name: "CGTIA Diploma",
    startDate: "To be announced",
    modality: "Online and in person"
  },
  "higher-diploma": {
    name: "CGTIA Higher Diploma",
    startDate: "To be announced",
    modality: "Online and in person"
  },
  licensing: {
    name: "Licensing",
    startDate: "To be announced",
    modality: "As scheduled"
  }
};

async function loadSiteSettingsNow() {
  const out = {
    cohortLabel: "Enrolling Now / 2026 Cohort",
    footerYear: "2026",
    programs: { ...DEFAULT_PROGRAMS }
  };
  try {
    const { db, api } = await getFirebase();
    // All reads start together, each with a time limit and one retry, so one stalled request can't block the rest
    const pSite = readDoc(api, db, "settings");
    const pTp = readDoc(api, db, "tuitionPage");
    const pPp = readDoc(api, db, "programsPage");
    const pHp = readDoc(api, db, "homePage");
    const pAp = readDoc(api, db, "aboutPage");
    const pGp = readDoc(api, db, "galleryPage");
    const pLg = readDoc(api, db, "legalPages");
    const pAf = readDoc(api, db, "applyForm");
    const pProg = readCollection(api, db, "programs");
    const site = await pSite;
    if (site.exists()) {
      const d = site.data();
      if (d.cohortLabel) out.cohortLabel = d.cohortLabel;
      if (d.footerYear) out.footerYear = String(d.footerYear);
    }
    try {
      const tp = await pTp;
      out.tuitionPage = tp.exists() ? tp.data() : null;
    } catch (e) { out.tuitionPage = null; }
    try {
      const pp = await pPp;
      out.programsPage = pp.exists() ? pp.data() : null;
    } catch (e) { out.programsPage = null; }
    try {
      const hp = await pHp;
      out.homePage = hp.exists() ? hp.data() : null;
    } catch (e) { out.homePage = null; }
    try {
      const ap = await pAp;
      out.aboutPage = ap.exists() ? ap.data() : null;
    } catch (e) { out.aboutPage = null; }
    try {
      const gp = await pGp;
      out.galleryPage = gp.exists() ? gp.data() : null;
    } catch (e) { out.galleryPage = null; }
    try {
      const lg = await pLg;
      out.legalPages = lg.exists() ? lg.data() : null;
    } catch (e) { out.legalPages = null; }
    try {
      const af = await pAf;
      out.applyForm = af.exists() ? af.data() : null;
    } catch (e) { out.applyForm = null; }
    const snap = await pProg;
    out.programs = snap.empty ? { ...DEFAULT_PROGRAMS } : {};
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      if (d.trashed === true) return;
      out.programs[docSnap.id] = {
        name: d.name || docSnap.id,
        startDate: d.startDate || "To be announced",
        modality: d.modality || "Online and in person",
        amount: d.amount,
        priceText: d.priceText || "",
        allowOnline: d.allowOnline !== false,
        allowInPerson: d.allowInPerson !== false,
        badge: d.badge || "",
        headline: d.headline || d.name || "",
        body: d.body || "",
        subtitle: d.subtitle || "",
        bullets: d.bullets || "",
        feature1: d.feature1 || "",
        feature2: d.feature2 || "",
        feature3: d.feature3 || "",
        feature4: d.feature4 || "",
        features: Array.isArray(d.features) ? d.features.map((x) => String(x || "").trim()).filter(Boolean) : [d.feature1, d.feature2, d.feature3, d.feature4].filter(Boolean),
        levelLabel: d.levelLabel || "",
        priceNote: d.priceNote || "",
        ctaLabel: d.ctaLabel || "Apply for This Program",
        ctaAction: d.ctaAction || "apply",
        showOnHome: d.showOnHome !== false,
        showOnTuition: d.showOnTuition !== false,
        active: d.active !== false,
        sortOrder: Number(d.sortOrder) || 0,
        ribbon: d.ribbon || ""
      };
    });
  } catch (e) {
    console.warn("site settings", e);
  }
  window.__cgtiaSiteSettings = out;
  applySiteSettingsToDom(out);
  applyTuitionPage(Object.assign({}, out.tuitionPage || {}, out.applyForm || {}));
  try { applyProgramsPage(out.programsPage); } catch (e) {}
  try { applySimpleCmsPage(out.homePage); } catch (e) {}
  try { applySimpleCmsPage(out.aboutPage); } catch (e) {}
  try { applySimpleCmsPage(out.galleryPage); } catch (e) {}
  applyLegalPages(out.legalPages);
  applyCustomFields(out.applyForm);
  installDomWatcher();
  applyTuitionCardCopy(out);
  try { renderProgramCards(out); } catch (e) { console.warn(e); }
  // Sync tuition card base amounts from admin (always)
  try {
    Object.keys(out.programs || {}).forEach((key) => {
      const prog = out.programs[key] || {};
      const amt = prog.amount;
      document.querySelectorAll('[data-tuition-program="' + key + '"]').forEach((el) => {
        if (amt != null && amt !== "") {
          el.setAttribute("data-full-amount", String(Number(amt)));
        }
        // feature lines e.g. 16 modules
        const root = el.closest("div.soft-component-card, article, .rounded-\[2\.5rem\], .rounded-\[2rem\]") || el.parentElement || el;
        const scope = root || el;
        if (prog.feature1) {
          let f1 = scope.querySelector("[data-tuition-feature='1']");
          if (!f1) {
            // fallback: list items under this card
            const items = scope.querySelectorAll("li, .flex.items-center");
            if (items[0]) { items[0].setAttribute("data-tuition-feature", "1"); f1 = items[0]; }
          }
          if (f1) f1.textContent = prog.feature1;
        }
        if (prog.feature2) {
          let f2 = scope.querySelector("[data-tuition-feature='2']");
          if (!f2) {
            const items = scope.querySelectorAll("li, .flex.items-center");
            if (items[1]) { items[1].setAttribute("data-tuition-feature", "2"); f2 = items[1]; }
          }
          if (f2) f2.textContent = prog.feature2;
        }
        if (prog.feature3) {
          let f3 = scope.querySelector("[data-tuition-feature='3']");
          if (!f3) {
            const items = scope.querySelectorAll("li, .flex.items-center");
            if (items[2]) { items[2].setAttribute("data-tuition-feature", "3"); f3 = items[2]; }
          }
          if (f3) f3.textContent = prog.feature3;
        }
      });
    });
  } catch (e) {
    console.warn("tuition amount sync", e);
  }
  // Re-apply promo strikethrough using latest base amounts
  try {
    if (window.__cgtiaApplyTuitionPromoPricing) {
      window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
    }
  } catch (e) {}
  return out;
}

export function applySiteSettingsToDom(settings) {
  document.querySelectorAll('[data-site-setting="cohortLabel"]').forEach((el) => {
    el.textContent = settings.cohortLabel;
  });
  document.querySelectorAll('[data-site-setting="footerYear"]').forEach((el) => {
    el.textContent = settings.footerYear;
  });
}

/** Used by classic handleProgramChange */
export function getProgramStartDate(programKey) {
  const s = window.__cgtiaSiteSettings;
  if (s && s.programs && s.programs[programKey]) return s.programs[programKey].startDate || "To be announced";
  return (DEFAULT_PROGRAMS[programKey] || {}).startDate || "To be announced";
}

export function getProgramModality(programKey) {
  const s = window.__cgtiaSiteSettings;
  if (s && s.programs && s.programs[programKey]) return s.programs[programKey].modality || "";
  return (DEFAULT_PROGRAMS[programKey] || {}).modality || "";
}


function applyTuitionCardCopy(settings) {
  document.querySelectorAll("[data-tuition-program]").forEach((node) => {
    const key = node.getAttribute("data-tuition-program");
    const p = settings.programs && settings.programs[key];
    if (!p) return;
    // Price node may be nested; use closest card-like parent for copy fields
    const card = node.closest("article, .soft-component-card, .rounded-\[2rem\], section, div") || node.parentElement || node;
    const scope = card.contains(node) ? card : node;
    const headline = scope.querySelector("[data-tuition-headline]");
    const body = scope.querySelector("[data-tuition-body]");
    const badge = scope.querySelector("[data-tuition-badge]");
    const bullets = scope.querySelector("[data-tuition-bullets]");
    const modality = scope.querySelector("[data-tuition-modality]");
    if (headline && p.headline) headline.textContent = p.headline;
    if (body && p.body) body.textContent = p.body;
    if (badge && p.badge) badge.textContent = p.badge;
    if (modality) modality.textContent = p.modality || "Online and in person";
    if (bullets && p.bullets) {
      const lines = String(p.bullets).split("\n").map((x) => x.trim()).filter(Boolean);
      bullets.innerHTML = lines.map((line) => "<li>" + line + "</li>").join("");
    }
    if (p.feature1) {
      const f1 = scope.querySelector("[data-tuition-feature='1']") || node.querySelector("[data-tuition-feature='1']");
      if (f1) f1.textContent = p.feature1;
    }
    if (p.feature2) {
      const f2 = scope.querySelector("[data-tuition-feature='2']");
      if (f2) f2.textContent = p.feature2;
    }
    if (p.feature3) {
      const f3 = scope.querySelector("[data-tuition-feature='3']");
      if (f3) f3.textContent = p.feature3;
    }
  });
}

export function getProgramStudyOptions(programKey) {
  const s = window.__cgtiaSiteSettings;
  const p = s && s.programs && s.programs[programKey];
  return {
    allowOnline: !p || p.allowOnline !== false,
    allowInPerson: !p || p.allowInPerson !== false,
    modality: (p && p.modality) || "Online and in person"
  };
}

function escapeText(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Terms and Privacy: sections rebuilt from the saved document */
export function applyLegalPages(lp) {
  if (!lp) return;
  ["terms", "privacy"].forEach((key) => {
    const el = document.querySelector('[data-cms-sections="' + key + '"]');
    const doc = lp[key];
    const sections = doc && Array.isArray(doc.sections) ? doc.sections.filter((x) => x && (x.heading || x.body)) : [];
    if (!el || !sections.length) return;
    el.innerHTML = sections.map((sec) => {
      const paras = String(sec.body || "").split(/\n+/).filter(Boolean).map((line) => {
        const bullet = line.indexOf("\u2022 ") === 0;
        const text = escapeText(bullet ? line.slice(2) : line);
        return bullet ? '<p class="pl-4">&bull; ' + text + "</p>" : "<p>" + text + "</p>";
      }).join("");
      return '<div><h2 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold mb-3">' + escapeText(sec.heading || "") + "</h2>" + paras + "</div>";
    }).join("");
  });
}

/** Apply form: custom questions (text, phone, email, date, long text, dropdown) */
const CF_CLASS = "w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-900/40 focus:bg-white outline-none text-sm text-slate-800 smooth-transition";
export function applyCustomFields(cfg) {
  const mount = document.getElementById("applyCustomFields");
  const fields = cfg && Array.isArray(cfg.customFields) ? cfg.customFields.filter((f) => f && f.label) : [];
  window.__cgtiaApplyFields = fields;
  if (!mount) return;
  mount.innerHTML = fields.map((f, i) => {
    const id = "cfield-" + i;
    const req = f.required ? " required" : "";
    const label = '<label for="' + id + '" class="text-xs font-semibold tracking-wide text-slate-500 uppercase block mb-2">' + escapeText(f.label) + (f.required ? ' <span class="text-red-400">*</span>' : "") + "</label>";
    let input;
    if (f.type === "long") {
      input = '<textarea id="' + id + '" rows="3" class="' + CF_CLASS + '"' + req + "></textarea>";
    } else if (f.type === "select") {
      input = '<select id="' + id + '" class="' + CF_CLASS + '"' + req + '><option value="">Select one</option>' +
        (f.options || []).map((o) => '<option value="' + escapeText(o) + '">' + escapeText(o) + "</option>").join("") + "</select>";
    } else {
      const t = { phone: "tel", email: "email", date: "date" }[f.type] || "text";
      input = '<input id="' + id + '" type="' + t + '" class="' + CF_CLASS + '"' + req + ">";
    }
    return "<div>" + label + input + "</div>";
  }).join("");
}

/** Reads custom answers. Returns null (and points at the field) if a required one is empty. */
window.__cgtiaCollectCustomAnswers = function () {
  const fields = window.__cgtiaApplyFields || [];
  const out = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const el = document.getElementById("cfield-" + i);
    if (!el) continue;
    const v = String(el.value || "").trim();
    if (f.required && !v) {
      if (el.reportValidity) el.reportValidity();
      el.focus();
      return null;
    }
    out.push({ label: f.label, type: f.type || "text", value: v });
  }
  return out;
};


function applyProgramsPage(pp) {
  if (!pp) return;
  const set = (sel, val) => {
    if (val == null || val === "") return;
    document.querySelectorAll(sel).forEach((el) => { el.textContent = val; });
  };
  set('[data-cms="ppEyebrow"]', pp.eyebrow);
  set('[data-cms="ppTitle"]', pp.title);
  set('[data-cms="ppIntro"]', pp.intro);
  set('[data-cms="ppTrackEyebrow"]', pp.trackEyebrow);
  set('[data-cms="ppTrackTitle"]', pp.trackTitle);
  set('[data-cms="ppDeliveryEyebrow"]', pp.deliveryEyebrow);
  set('[data-cms="ppDeliveryTitle"]', pp.deliveryTitle);
  set('[data-cms="ppCtaEyebrow"]', pp.ctaEyebrow);
  set('[data-cms="ppCtaTitle"]', pp.ctaTitle);
  set('[data-cms="ppCtaBody"]', pp.ctaBody);
  set('[data-cms="ppCtaLabel"]', pp.ctaLabel);
  set('[data-cms="ppPathEyebrow"]', pp.pathEyebrow);
  set('[data-cms="ppPathTitle"]', pp.pathTitle);
  set('[data-cms="ppPathCtaLabel"]', pp.pathCtaLabel);

  const trackHost = document.querySelector('[data-cms-sections="ppTrackCards"]');
  if (trackHost && Array.isArray(pp.trackCards) && pp.trackCards.length) {
    trackHost.innerHTML = pp.trackCards.map((c) => {
      const bullets = (c.bullets || []).map((b) =>
        '<li class="flex items-center gap-3"><span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>' + String(b).replace(/</g, "&lt;") + "</li>"
      ).join("");
      return (
        '<div class="soft-component-card p-8 md:p-10 rounded-[2.5rem] flex flex-col justify-between gap-8 group smooth-transition">' +
        "<div>" +
        (c.badge ? '<span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase block mb-2">' + String(c.badge).replace(/</g, "&lt;") + "</span>" : "") +
        '<h3 class="font-editorial text-2xl md:text-3xl text-blue-950 font-bold leading-tight mb-4">' + String(c.title || "").replace(/</g, "&lt;") + "</h3>" +
        '<p class="text-slate-500 font-light text-sm md:text-base leading-relaxed">' + String(c.body || "").replace(/</g, "&lt;") + "</p>" +
        "</div>" +
        (bullets ? '<ul class="space-y-3 pt-6 border-t border-slate-200/40 text-sm text-slate-600 font-light">' + bullets + "</ul>" : "") +
        "</div>"
      );
    }).join("");
  }

  const delHost = document.querySelector('[data-cms-sections="ppDeliveryCards"]');
  if (delHost && Array.isArray(pp.deliveryCards) && pp.deliveryCards.length) {
    delHost.innerHTML = pp.deliveryCards.map((c) => (
      '<div class="soft-component-card p-8 md:p-10 rounded-[2.5rem] flex flex-col gap-4">' +
      (c.label ? '<span class="text-xs font-bold tracking-widest text-slate-400 uppercase">' + String(c.label).replace(/</g, "&lt;") + "</span>" : "") +
      '<h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold">' + String(c.title || "").replace(/</g, "&lt;") + "</h3>" +
      '<p class="text-slate-500 font-light text-sm leading-relaxed">' + String(c.body || "").replace(/</g, "&lt;") + "</p>" +
      "</div>"
    )).join("");
  }

  const pathHost = document.querySelector('[data-cms-sections="ppPathSteps"]');
  if (pathHost && Array.isArray(pp.pathSteps) && pp.pathSteps.length) {
    pathHost.innerHTML = pp.pathSteps.map((s, i) => {
      const num = String(s.num || String(i + 1).padStart(2, "0")).replace(/</g, "&lt;");
      const title = String(s.title || "").replace(/</g, "&lt;");
      const body = String(s.body || "").replace(/</g, "&lt;");
      return (
        '<div class="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-8 py-8 border-b border-slate-200/60">' +
        '<div class="md:col-span-1 font-editorial text-2xl text-blue-950 font-bold">' + num + "</div>" +
        '<div class="md:col-span-3"><h4 class="font-editorial text-xl text-blue-950 font-bold">' + title + "</h4></div>" +
        '<div class="md:col-span-8 text-slate-500 font-light text-base leading-relaxed">' + body + "</div>" +
        "</div>"
      );
    }).join("");
  }
}

/** Applies admin-edited tuition wording to any element marked data-cms / data-cms-list */
export function applyTuitionPage(tp) {
  if (!tp) return;
  document.querySelectorAll("[data-cms]").forEach((el) => {
    const v = tp[el.getAttribute("data-cms")];
    if (typeof v === "string" && v.trim()) el.textContent = v;
  });
  document.querySelectorAll("[data-cms-list]").forEach((el) => {
    const items = Array.isArray(tp[el.getAttribute("data-cms-list")])
      ? tp[el.getAttribute("data-cms-list")].filter(Boolean)
      : [];
    if (items.length) el.innerHTML = items.map((t) => "<p>" + escapeText(t) + "</p>").join("");
  });
}

/**
 * Pages are rendered after startup (lazy routes), so saved wording, programme
 * cards, terms and the apply form must be applied again each time a page appears.
 */
const WATCH_SELECTOR = "[data-cms],[data-cms-list],[data-cms-sections],#applyCustomFields,#cgtiaTuitionProgramCards,#cgtiaHomeProgramCards";

export function reapplyDynamicContent() {
  try { applyProgramsPage((window.__cgtiaSiteSettings || {}).programsPage); } catch (e) {}
  const s = window.__cgtiaSiteSettings;
  if (!s) return;
  applySiteSettingsToDom(s);
  applyTuitionPage(Object.assign({}, s.tuitionPage || {}, s.applyForm || {}));
  try { applySimpleCmsPage(s.homePage); } catch (e) {}
  try { applySimpleCmsPage(s.aboutPage); } catch (e) {}
  try { applySimpleCmsPage(s.galleryPage); } catch (e) {}
  applyLegalPages(s.legalPages);
  applyCustomFields(s.applyForm);
  try { renderProgramCards(s); } catch (e) { /* ignore */ }
}

/** Generic: string fields → [data-cms="key"]; string[] → [data-cms-list="key"] as <p>s; object[] for known section hosts */
function applySimpleCmsPage(page) {
  if (!page || typeof page !== "object") return;
  const esc = (s) => String(s || "").replace(/</g, "&lt;");
  Object.keys(page).forEach((key) => {
    const val = page[key];
    if (typeof val === "string" && val.trim()) {
      document.querySelectorAll('[data-cms="' + key + '"]').forEach((el) => { el.textContent = val; });
    } else if (Array.isArray(val) && val.length && typeof val[0] === "string") {
      const host = document.querySelector('[data-cms-list="' + key + '"]');
      if (host) host.innerHTML = val.filter(Boolean).map((t) => "<p>" + esc(t) + "</p>").join("");
    }
  });
  // About history steps: {title, body}
  const hist = document.querySelector('[data-cms-sections="aboutHistorySteps"]');
  if (hist && Array.isArray(page.historySteps) && page.historySteps.length) {
    hist.innerHTML = page.historySteps.map((s) => (
      '<div class="soft-component-card p-8 rounded-[2.5rem] flex flex-col gap-3 border border-white/60">' +
      '<span class="font-editorial text-2xl md:text-3xl text-blue-950 font-bold">' + esc(s.title) + "</span>" +
      '<p class="text-slate-500 font-light text-sm leading-relaxed">' + esc(s.body) + "</p></div>"
    )).join("");
  }
  const goals = document.querySelector('[data-cms-sections="aboutGoals"]');
  if (goals && Array.isArray(page.goals) && page.goals.length) {
    goals.innerHTML = page.goals.map((s) => (
      '<div class="group cursor-pointer">' +
      '<h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold group-hover:translate-x-1.5 smooth-transition">' + esc(s.title) + "</h3>" +
      '<p class="text-slate-500 font-light text-sm mt-2 leading-relaxed">' + esc(s.body) + "</p></div>"
    )).join("");
  }
  const board = document.querySelector('[data-cms-sections="aboutBoard"]');
  if (board && Array.isArray(page.board) && page.board.length) {
    board.innerHTML = page.board.map((s) => {
      const initial = esc((s.title || "?").charAt(0).toUpperCase());
      return (
        '<div class="soft-component-card p-8 rounded-[2.5rem] flex flex-col items-start gap-5 border border-white/60">' +
        '<div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center font-editorial font-bold text-blue-900 text-lg">' + initial + "</div>" +
        "<div><h4 class=\"font-editorial text-lg font-bold text-blue-950\">" + esc(s.title) + "</h4>" +
        (s.role ? '<span class="text-[10px] text-slate-400 uppercase tracking-widest">' + esc(s.role) + "</span>" : "") +
        "</div><p class=\"text-slate-500 font-light text-xs leading-relaxed\">" + esc(s.body) + "</p></div>"
      );
    }).join("");
  }

  // Home section visibility (same idea as showOnHome for programmes)
  const sectionMap = {
    practice: page.showPractice,
    tuition: page.showTuition,
    partners: page.showPartners,
    insights: page.showInsights,
    galleryTeaser: page.showGalleryTeaser,
    offerings: page.showOfferings,
    voices: page.showVoices,
    wallTeaser: page.showWallTeaser
  };
  Object.keys(sectionMap).forEach((id) => {
    const vis = sectionMap[id];
    if (vis === false || vis === true) {
      document.querySelectorAll('[data-home-section="' + id + '"]').forEach((el) => {
        el.style.display = vis ? "" : "none";
      });
    }
  });

  // Home testimonials rebuild
  const voices = document.querySelector('[data-cms-sections="homeTestimonials"]');
  if (voices && Array.isArray(page.testimonials) && page.testimonials.length) {
    voices.innerHTML = page.testimonials.map((t) => (
      '<div class="snap-center shrink-0 w-[85vw] sm:w-[480px] soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/70 shadow-sm flex flex-col justify-between gap-8">' +
      '<p class="font-editorial text-xl md:text-2xl text-blue-950 font-light leading-relaxed italic">"' + esc(t.quote || t.body || "") + '"</p>' +
      '<div class="flex items-center gap-4 pt-4 border-t border-slate-200/40">' +
      '<div class="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-editorial font-bold text-blue-900 text-sm">' + esc((t.name || t.title || "?").charAt(0).toUpperCase()) + "</div>" +
      "<div><h4 class=\"text-xs font-bold tracking-wide text-blue-950\">" + esc(t.name || t.title || "") + "</h4>" +
      (t.role ? '<span class="text-[10px] text-slate-400 uppercase tracking-widest">' + esc(t.role) + "</span>" : "") +
      "</div></div></div>"
    )).join("");
  }

  // Institutional offerings cards on home (static arc cards host)
  const offerHost = document.querySelector("#program-track");
  if (offerHost && Array.isArray(page.offerings) && page.offerings.length) {
    offerHost.innerHTML = page.offerings.map((o) => (
      '<div class="program-arc-card soft-component-card p-8 rounded-[2rem] border border-white/60 flex flex-col gap-3 min-w-[260px]">' +
      (o.badge ? '<span class="text-[10px] font-bold tracking-widest text-blue-800 uppercase">' + esc(o.badge) + "</span>" : "") +
      '<h3 class="font-editorial text-xl md:text-2xl text-blue-950 font-bold leading-tight">' + esc(o.title || "") + "</h3>" +
      '<p class="text-slate-500 font-light text-sm leading-relaxed">' + esc(o.body || "") + "</p></div>"
    )).join("");
  }
}

let domWatcherInstalled = false;
function installDomWatcher() {
  if (domWatcherInstalled || typeof MutationObserver === "undefined") return;
  domWatcherInstalled = true;
  let timer = null;
  const target = document.getElementById("root") || document.body;
  const observer = new MutationObserver((mutations) => {
    const hit = mutations.some((m) => Array.from(m.addedNodes).some((n) =>
      n.nodeType === 1 && (n.matches(WATCH_SELECTOR) || n.querySelector(WATCH_SELECTOR))
    ));
    if (!hit) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try { reapplyDynamicContent(); } catch (e) { console.warn("reapply", e); }
    }, 60);
  });
  observer.observe(target, { childList: true, subtree: true });
}

let settingsPromise = null;
/** Loads site settings once. Pass { force: true } to re-fetch (admin edits while visitor stays on page). */
export function loadSiteSettings(opts) {
  const force = opts && opts.force;
  if (force) settingsPromise = null;
  if (!settingsPromise) {
    settingsPromise = loadSiteSettingsNow().then((out) => {
      window.__cgtiaApplyAllContent = reapplyDynamicContent;
      try { reapplyDynamicContent(); } catch (e) { /* ignore */ }
      return out;
    });
  }
  return settingsPromise;
}

/** Soft refresh of CMS data only — never reloads the browser tab. */
export async function refreshSiteSettingsLive() {
  try {
    await loadSiteSettings({ force: true });
  } catch (e) {
    console.warn("[cgtia] live settings refresh", e);
  }
}


/* ---- timed, retried reads for the public site ---- */
const READ_TIMEOUT_MS = 6000;
function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timed out")), ms))
  ]);
}
async function readDoc(api, db, name) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withTimeout(api.getDoc(api.doc(db, "siteContent", name)), READ_TIMEOUT_MS);
    } catch (e) {
      console.warn("[cgtia] could not read siteContent/" + name + " (attempt " + (attempt + 1) + ")", e && e.message);
    }
  }
  return { exists: () => false, data: () => undefined };
}
async function readCollection(api, db, name) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      return await withTimeout(api.getDocs(api.collection(db, name)), READ_TIMEOUT_MS);
    } catch (e) {
      console.warn("[cgtia] could not read " + name + " (attempt " + (attempt + 1) + ")", e && e.message);
    }
  }
  return { empty: true, forEach: () => {} };
}
