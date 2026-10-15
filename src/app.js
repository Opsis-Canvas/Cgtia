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
import { loadPageControl, pageKeyFor } from "./services/page-control.service.js";
import "./services/program-payment.service.js";
import { PageStatus, NotFoundPage } from "./pages/page-status.page.js";
import { installAuthFlow } from "./services/auth.service.js";
import { installPromoBanner, loadActivePromotions, renderPromoBanner, refreshPromoBannerLive } from "./services/promo-banner.service.js";
import { loadSiteSettings, refreshSiteSettingsLive, getProgramStartDate, getProgramModality, getProgramStudyOptions } from "./services/site-settings.service.js";
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
  [ROUTES.PAY_FEE]: async () => function PayFeePage() { return null; },
  "/index": lazy(() => import("./pages/home.page.js"), "HomePage"),
  __notfound__: () => NotFoundPage
};

const root = createRoot(document.getElementById("root"));

const pageControlReady = loadPageControl();
const settingsReady = loadSiteSettings().catch(() => null);
// Never hold a page back for more than 2.5 seconds, even on a slow or blocked connection
const renderGate = Promise.race([
  Promise.all([pageControlReady, settingsReady]),
  new Promise((resolve) => setTimeout(() => resolve([null, null]), 4000))
]);

function renderPage(PageComponent) {
  renderGate.then(([control]) => {
    const path = (window.location.pathname || "").replace(/\/$/, "") || "/";
    // Fee-payment links are owned by runtime-classic.js (not a React page)
    if (path === "/pay-fee" || path.endsWith("/pay-fee")) {
      if (typeof window.__cgtiaBootPayFee === "function") {
        try { window.__cgtiaBootPayFee(); } catch (e) { console.error(e); }
      }
      return;
    }
    const key = pageKeyFor(window.location.pathname);
    const rule = control && key ? control[key] : null;
    if (rule && rule.mode && rule.mode !== "live") {
      root.render(html`<${PageStatus} rule=${rule} />`);
      return;
    }
    root.render(html`<${PageComponent} />`);
  });
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


/**
 * Soft live updates: when admin changes promos / programmes / page copy,
 * visitors pick it up without a full browser refresh (safe during payment).
 */
let __cgtiaLiveBusy = false;
async function softLiveRefresh(reason) {
  if (__cgtiaLiveBusy) return;
  // Never interrupt an open Paystack iframe / fee payment confirm
  if (document.querySelector('iframe[src*="paystack"], #paymentScreen:not(.pointer-events-none), [data-cgtia-paying="1"]')) {
    return;
  }
  __cgtiaLiveBusy = true;
  try {
    await Promise.all([
      refreshSiteSettingsLive().catch(() => {}),
      refreshPromoBannerLive().catch(() => {})
    ]);
  } finally {
    __cgtiaLiveBusy = false;
  }
}

/* Pause CSS marquees when tab is hidden; refresh CMS when user returns */
document.addEventListener("visibilitychange", () => {
  const paused = document.hidden;
  document.querySelectorAll(".animate-marquee-left, .animate-marquee-right").forEach((el) => {
    el.style.animationPlayState = paused ? "paused" : "running";
  });
  if (!document.hidden) softLiveRefresh("visible");
});

/* While the tab stays open, re-check every 30s */
setInterval(() => {
  if (!document.hidden) softLiveRefresh("interval");
}, 30000);

window.__cgtiaSoftLiveRefresh = softLiveRefresh;

