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

export async function loadSiteSettings() {
  const out = {
    cohortLabel: "Enrolling Now / 2026 Cohort",
    footerYear: "2026",
    programs: { ...DEFAULT_PROGRAMS }
  };
  try {
    const { db, api } = await getFirebase();
    const site = await api.getDoc(api.doc(db, "siteContent", "settings"));
    if (site.exists()) {
      const d = site.data();
      if (d.cohortLabel) out.cohortLabel = d.cohortLabel;
      if (d.footerYear) out.footerYear = String(d.footerYear);
    }
    const snap = await api.getDocs(api.collection(db, "programs"));
    snap.forEach((docSnap) => {
      const d = docSnap.data();
      out.programs[docSnap.id] = {
        name: d.name || docSnap.id,
        startDate: d.startDate || "To be announced",
        modality: d.modality || "Online and in person",
        amount: d.amount,
        allowOnline: d.allowOnline !== false,
        allowInPerson: d.allowInPerson !== false,
        badge: d.badge || "",
        headline: d.headline || d.name || "",
        body: d.body || "",
        subtitle: d.subtitle || d.body || "",
        bullets: d.bullets || "",
        feature1: d.feature1 || "",
        feature2: d.feature2 || "",
        feature3: d.feature3 || "",
        feature4: d.feature4 || "",
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
