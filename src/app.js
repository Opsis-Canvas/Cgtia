/**
 * --------------------------------------------------------
 * File:        app.js
 * Purpose:     Application bootstrap — React 19 + HTM buildless
 * Responsibility: Root, lazy router, page table
 * --------------------------------------------------------
 */

import { createElement } from "react";
import { createRoot } from "react-dom/client";
import htm from "htm";
import { createRouter } from "./router/router.js";
import { ROUTES } from "./config/routes.config.js";
import { installApplyFlow } from "./services/apply-flow.service.js";
import { installAuthFlow } from "./services/auth.service.js";
import { installPromoBanner, loadActivePromotions, renderPromoBanner } from "./services/promo-banner.service.js";
import { loadSiteSettings, getProgramStartDate, getProgramModality, getProgramStudyOptions } from "./services/site-settings.service.js";
import { getActivePromotion, getProgramPricing } from "./services/firebase.service.js";

const html = htm.bind(createElement);

/** Cache resolved page modules so repeat visits are instant */
const pageCache = new Map();

function lazy(importer, exportName) {
  return async () => {
    const key = exportName;
    if (pageCache.has(key)) return pageCache.get(key);
    const mod = await importer();
    const Page = mod[exportName];
    pageCache.set(key, Page);
    return Page;
  };
}

/**
 * Only the route being viewed is downloaded.
 * Home is still lazy so the first paint stays small; browser caches after.
 */
const routeTable = {
  [ROUTES.HOME]: lazy(() => import("./pages/home.page.js"), "HomePage"),
  [ROUTES.ABOUT]: lazy(() => import("./pages/about.page.js"), "AboutPage"),
  [ROUTES.PROGRAMS]: lazy(() => import("./pages/programs.page.js"), "ProgramsPage"),
  [ROUTES.GALLERY]: lazy(() => import("./pages/gallery.page.js"), "GalleryPage"),
  [ROUTES.TUITION]: lazy(() => import("./pages/tuition.page.js"), "TuitionPage"),
  [ROUTES.CONTACT]: lazy(() => import("./pages/contact.page.js"), "ContactPage"),
  [ROUTES.LICENSING]: lazy(() => import("./pages/licensing.page.js"), "LicensingPage"),
  [ROUTES.CUSTOM]: lazy(() => import("./pages/custom.page.js"), "CustomPage"),
  [ROUTES.PRIVACY]: lazy(() => import("./pages/privacy.page.js"), "PrivacyPage"),
  [ROUTES.TERMS]: lazy(() => import("./pages/terms.page.js"), "TermsPage"),
  [ROUTES.VERIFY]: lazy(() => import("./pages/verify.page.js"), "VerifyPage"),
  [ROUTES.FIELD_CHECK]: lazy(() => import("./pages/field-check.page.js"), "FieldCheckPage"),
  [ROUTES.FAQ]: lazy(() => import("./pages/faq.page.js"), "FaqPage"),
  [ROUTES.LICENSING_COMPLETE]: lazy(() => import("./pages/licensing-complete.page.js"), "LicensingCompletePage"),
  [ROUTES.DASHBOARD]: lazy(() => import("./pages/dashboard.page.js"), "DashboardPage"),
  [ROUTES.WALL_OF_FAME]: lazy(() => import("./pages/wall-of-fame.page.js"), "WallOfFamePage"),
  "/index": lazy(() => import("./pages/home.page.js"), "HomePage")
};

const root = createRoot(document.getElementById("root"));

function renderPage(PageComponent) {
  root.render(html`<${PageComponent} />`);
}

const router = createRouter(routeTable, renderPage);

window.__cgtiaNavigate = (path) => {
  if (!path) path = "/";
  if (path.endsWith(".html")) {
    path = path.replace(/\.html$/, "");
    if (path === "index" || path === "/index") path = "/";
    if (!path.startsWith("/")) path = "/" + path;
  }
  router.navigate(path);
};

window.__cgtiaRouter = router;

installApplyFlow();
installAuthFlow();
(async () => {
  try { await loadSiteSettings(); } catch (e) {}
  try { await installPromoBanner(); } catch (e) {}
  // One more price pass after both ready
  try {
    if (window.__cgtiaApplyTuitionPromoPricing) {
      window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
    }
  } catch (e) {}
})();
window.__cgtiaGetProgramStartDate = getProgramStartDate;
window.__cgtiaGetProgramModality = getProgramModality;
window.__cgtiaGetProgramStudyOptions = getProgramStudyOptions;

window.__cgtiaRefreshPromoBanner = async () => {
  const list = await loadActivePromotions();
  renderPromoBanner(list);
};
window.__cgtiaInstallAuth = installAuthFlow;

// Pricing helpers for classic payment UI
window.__cgtiaGetActivePromotion = getActivePromotion;
window.__cgtiaGetProgramPricing = getProgramPricing;


/* Pause CSS marquees when tab is hidden */
document.addEventListener("visibilitychange", () => {
  const paused = document.hidden;
  document.querySelectorAll(".animate-marquee-left, .animate-marquee-right").forEach((el) => {
    el.style.animationPlayState = paused ? "paused" : "running";
  });
});
