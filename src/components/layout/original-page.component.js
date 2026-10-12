/**
 * --------------------------------------------------------
 * File:        original-page.component.js
 * Purpose:     Render original page markup without visual changes
 * --------------------------------------------------------
 */

import { createElement, useEffect, useRef } from "react";
import htm from "htm";
import { hydrateWallOfFameUI } from "../../services/wall-of-fame.service.js";

const html = htm.bind(createElement);

export const OriginalPage = ({ markup }) => {
  const ref = useRef(null);

  useEffect(() => {
    // Unlock body scroll (bottom sheet may have frozen it)
    try {
      document.body.style.overflow = "";
    } catch (e) {}
    // Ensure no stuck desktop/mobile overlay blocks clicks after SPA nav
    try {
      ["applyScreen", "statusScreen", "paymentScreen", "authScreen", "mobileBottomSheet"].forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.classList.add("pointer-events-none", "bg-slate-950/0", "backdrop-blur-0");
        el.classList.remove("pointer-events-auto", "bg-slate-950/40", "backdrop-blur-md");
        el.style.pointerEvents = "none";
      });
      ["applyDrawer", "statusDrawer", "paymentDrawer", "authDrawer", "bottomSheetDrawer"].forEach((id) => {
        const d = document.getElementById(id);
        if (!d) return;
        // Keep bottom sheet fully off-screen; clearing transform lets it peek on scroll
        d.style.transform = id === "bottomSheetDrawer" ? "translateY(110%)" : "";
        d.style.opacity = "";
        d.style.pointerEvents = id === "bottomSheetDrawer" ? "none" : "";
      });
      const sheet = document.getElementById("mobileBottomSheet");
      if (sheet) {
        sheet.style.visibility = "hidden";
        sheet.style.background = "transparent";
        sheet.style.backdropFilter = "none";
        sheet.style.webkitBackdropFilter = "none";
      }
    } catch (e) {}

    const timer = setTimeout(() => {
      try {
        if (typeof window.initProgramArcEngine === "function") {
          window.initProgramArcEngine();
        }
        if (typeof window.ensureMobileBottomSheetClosed === "function") {
          window.ensureMobileBottomSheetClosed();
        }
        if (typeof window.initFunctionalDragHandleEngine === "function") {
          window.initFunctionalDragHandleEngine();
        }
        // Runtime hard-binds live on window; just re-init engines after inject
        try {
          if (typeof window.initProgramArcEngine === "function") window.initProgramArcEngine();
        } catch (e) {}
        try {
          hydrateWallOfFameUI();
          try {
            if (window.__cgtiaInstallAuth) window.__cgtiaInstallAuth();
            if (window.__cgtiaRefreshPromoBanner) window.__cgtiaRefreshPromoBanner();
            if (window.__cgtiaApplyTuitionPromoPricing) {
              window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
            }
            if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1" && window.__cgtiaShowSolidBottomPromoBar) {
              window.__cgtiaShowSolidBottomPromoBar();
            }
            if (window.__cgtiaSiteSettings && window.__cgtiaRefreshSiteSettings) {
              window.__cgtiaRefreshSiteSettings();
            }
          } catch (e) {}
          if (typeof window.checkPendingPaymentOnLoad === "function") {
            window.checkPendingPaymentOnLoad();
          }
        } catch (err) {
          console.warn("Wall of Fame hydrate:", err);
        }
      } catch (err) {
        console.warn("Runtime re-init:", err);
      }

      // Restore morphing pill loading state after SPA navigation
      try {
        let active = null;
        let label = null;
        try {
          active = sessionStorage.getItem("pillNavActive");
          label = sessionStorage.getItem("pillNavLabel");
        } catch (e) {}

        const pillWrap = document.getElementById("morphingIndicatorPill");
        const labelText = document.getElementById("morphingIndicatorText");

        if (active && pillWrap && labelText) {
          labelText.innerText = label || "";
          pillWrap.classList.remove("pill-error");
          pillWrap.classList.add("state-expanded");

          setTimeout(() => {
            pillWrap.classList.remove("state-expanded");
            try {
              sessionStorage.removeItem("pillNavActive");
              sessionStorage.removeItem("pillNavLabel");
            } catch (e) {}
          }, 2000);
        } else if (typeof window.restoreArrivalPill === "function") {
          window.restoreArrivalPill();
        }
      } catch (err) {
        console.warn("Pill restore:", err);
      }
    }, 60);

    window.scrollTo(0, 0);
    return () => clearTimeout(timer);
  }, [markup]);

  return html`
    <div
      ref=${ref}
      dangerouslySetInnerHTML=${{ __html: markup }}
    ></div>
  `;
};
