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
  const s = window.__cgtiaSiteSettings;
  if (!s) return;
  applySiteSettingsToDom(s);
  applyTuitionPage(Object.assign({}, s.tuitionPage || {}, s.applyForm || {}));
  applyLegalPages(s.legalPages);
  applyCustomFields(s.applyForm);
  try { renderProgramCards(s); } catch (e) { /* ignore */ }
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
