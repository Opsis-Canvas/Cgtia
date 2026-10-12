/**
 * Active promotions: top banner + tuition strikethrough + payment amount
 */
import { getFirebase } from "./firebase.service.js";

function formatNaira(n) {
  return "₦" + Number(n || 0).toLocaleString("en-NG");
}

/** Short display: 300000 → ₦300k, 100000 → ₦100k, 1500 → ₦1.5k */
function formatNairaShort(n) {
  const v = Number(n) || 0;
  if (v >= 1000000) {
    const m = v / 1000000;
    return "₦" + (Number.isInteger(m) ? m : m.toFixed(1).replace(/\.0$/, "")) + "m";
  }
  if (v >= 1000) {
    const k = v / 1000;
    return "₦" + (Number.isInteger(k) ? k : k.toFixed(1).replace(/\.0$/, "")) + "k";
  }
  return "₦" + v;
}

function programLabel(key) {
  const map = {
    certificate: "Certificate",
    diploma: "Diploma",
    "higher-diploma": "Higher Diploma",
    licensing: "Licensing"
  };
  return map[key] || key;
}

export async function loadActivePromotions() {
  try {
    const { db, api } = await getFirebase();
    const snap = await api.getDocs(api.collection(db, "promotions"));
    const list = [];
    const now = Date.now();
    snap.forEach((d) => {
      const data = { id: d.id, ...d.data() };
      if (data.hibernated) return;
      if (!data.active) return;
      if (data.endsAt) {
        const end = data.endsAt.toMillis ? data.endsAt.toMillis() : new Date(data.endsAt).getTime();
        if (end && end < now) return;
      }
      if (data.startsAt) {
        const start = data.startsAt.toMillis ? data.startsAt.toMillis() : new Date(data.startsAt).getTime();
        if (start && start > now) return;
      }
      list.push(data);
    });
    window.__cgtiaActivePromos = list;
    return list;
  } catch (e) {
    window.__cgtiaActivePromos = [];
    return [];
  }
}

function countdownHtml(endsAt) {
  if (!endsAt) return "";
  const end = endsAt.toMillis ? endsAt.toMillis() : new Date(endsAt).getTime();
  if (!end) return "";
  return `<span data-promo-countdown="${end}" class="font-semibold tracking-wide">…</span>`;
}

function tickCountdowns() {
  document.querySelectorAll("[data-promo-countdown]").forEach((el) => {
    const end = Number(el.getAttribute("data-promo-countdown"));
    const diff = end - Date.now();
    if (diff <= 0) {
      el.textContent = "ended";
      // Reload promos so expired ones drop off
      if (window.__cgtiaRefreshPromoBanner) {
        clearInterval(window.__cgtiaPromoTimer);
        window.__cgtiaPromoTimer = null;
        window.__cgtiaRefreshPromoBanner();
      }
      return;
    }
    const s = Math.floor(diff / 1000);
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    el.textContent = d > 0
      ? `${d}d ${pad(h)}h ${pad(m)}m ${pad(sec)}s`
      : `${pad(h)}h ${pad(m)}m ${pad(sec)}s`;
  });
}

export function renderPromoBanner(list) {
  let bar = document.getElementById("cgtiaPromoBanner");
  if (!list || !list.length) {
    if (bar) bar.remove();
    return;
  }
  if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1") {
    window.__cgtiaPromoMinimized = true;
    if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "cgtiaPromoBanner";
    bar.setAttribute(
      "style",
      "position:sticky;top:0;z-index:90;background:#0f172a;color:#fff;padding:12px 18px;font-size:13px;line-height:1.5;transform:translateY(-100%);transition:transform 0.55s cubic-bezier(0.16,1,0.3,1);cursor:pointer;"
    );
    bar.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("[data-promo-close]")) return;
      // Close top banner and show solid bottom bar after navigation
      sessionStorage.setItem("cgtiaPromoBannerClosed", "1");
      window.__cgtiaPromoMinimized = true;
      if (window.__cgtiaNavigate) window.__cgtiaNavigate("/tuition");
      else if (window.navigateWithPill) window.navigateWithPill("Tuition", "tuition.html");
      else window.location.href = "/tuition";
      setTimeout(function () {
        if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
        if (window.__cgtiaApplyTuitionPromoPricing) {
          window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
        }
      }, 400);
    });
    document.body.prepend(bar);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        bar.style.transform = "translateY(0)";
      });
    });
  }

  bar.innerHTML = list
    .map((p) => {
      const title = p.title || p.badge || "Notice";
      const desc = p.description ? ` — ${p.description}` : "";
      const timer = p.endsAt ? ` · Ends in ${countdownHtml(p.endsAt)}` : "";
      if (p.type === "announcement") {
        const link = p.linkUrl
          ? ` <a href="${p.linkUrl}" target="_blank" rel="noopener" style="color:#93c5fd;text-decoration:underline">${p.linkLabel || "Read more"}</a>`
          : "";
        return `<div style="margin-bottom:6px"><strong>${title}</strong>${desc}${timer}${link}</div>`;
      }
      const progs = (p.programs || []).map(programLabel).join(", ") || "selected programmes";
      const amount = formatNairaShort(p.promoAmount);
      const auto = p.requiresCode
        ? "Enter your promo code at payment."
        : "Applies automatically when you apply for these programmes.";
      return `<div style="margin-bottom:6px"><strong>${title}</strong>${desc}<br/>${amount} for ${progs}${timer}<br/><span style="opacity:.85">${auto}</span></div>`;
    })
    .join("") + '<button type="button" data-promo-close aria-label="Close" style="position:absolute;right:10px;top:8px;background:transparent;border:0;color:#94a3b8;font-size:18px;line-height:1;cursor:pointer;padding:4px 8px">×</button>';

  bar.style.position = "sticky";
  bar.onclick = bar.onclick;
  var closeBtn = bar.querySelector("[data-promo-close]");
  if (closeBtn) {
    closeBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      bar.style.transform = "translateY(-100%)";
      sessionStorage.setItem("cgtiaPromoBannerClosed", "1");
      window.__cgtiaPromoMinimized = true;
      setTimeout(function () {
        if (bar && bar.parentNode) bar.remove();
        if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
      }, 500);
    };
  }

  tickCountdowns();
  if (!window.__cgtiaPromoTimer) {
    window.__cgtiaPromoTimer = setInterval(tickCountdowns, 1000);
  }

  applyTuitionPromoPricing(list);
}

/** Strikethrough full price + bold promo on tuition cards */
export function applyTuitionPromoPricing(list) {
  const byProgram = {};
  (list || []).forEach((p) => {
    if (p.type === "announcement") return;
    if (p.requiresCode) return;
    (p.programs || []).forEach((key) => {
      byProgram[key] = p;
    });
  });

  document.querySelectorAll("[data-tuition-program]").forEach((el) => {
    const key = el.getAttribute("data-tuition-program");
    const full = Number(el.getAttribute("data-full-amount") || 0);
    const promo = byProgram[key];
    const priceRoot = el.querySelector("[data-tuition-price]");
    if (!priceRoot || !full) return;
    if (promo && promo.promoAmount) {
      priceRoot.innerHTML =
        `<span style="text-decoration:line-through;opacity:.4;font-size:0.55em;font-weight:500;margin-right:0.35em;vertical-align:middle">${formatNairaShort(full)}</span>` +
        `<span style="font-weight:700;font-size:1em;letter-spacing:-0.02em">${formatNairaShort(promo.promoAmount)}</span>` +
        `<span style="display:block;font-size:11px;font-weight:400;letter-spacing:0.02em;line-height:1.45;color:#1e3a8a;margin-top:8px;max-width:16rem">${promo.title || "Promo price"}</span>`;
    } else {
      priceRoot.innerHTML = `<span style="font-weight:800">${formatNairaShort(full)}</span>`;
    }
  });
}

export function matchPromoForProgram(programKey, codeInput) {
  const list = window.__cgtiaActivePromos || [];
  const code = String(codeInput || "").trim().toUpperCase();
  for (const p of list) {
    const programs = p.programs || [];
    if (programs.length && !programs.includes(programKey) && !programs.includes("all")) continue;
    if (p.requiresCode) {
      if (!code || String(p.code || "").trim().toUpperCase() !== code) continue;
      return p;
    }
  }
  for (const p of list) {
    if (p.requiresCode) continue;
    const programs = p.programs || [];
    if (!programs.length || programs.includes(programKey) || programs.includes("all")) return p;
  }
  return null;
}

window.__cgtiaApplyTuitionPromoPricing = applyTuitionPromoPricing;

export async function installPromoBanner() {
  const list = await loadActivePromotions();
  window.__cgtiaMatchPromo = matchPromoForProgram;
  window.__cgtiaActivePromos = list;
  if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1") {
    window.__cgtiaPromoMinimized = true;
    showSolidBottomPromoBar();
  } else {
    renderPromoBanner(list);
  }
  setTimeout(() => applyTuitionPromoPricing(window.__cgtiaActivePromos || list), 500);
}



/** Bottom-left promo bell — does not cover the ⋮ menu */
export function showSolidBottomPromoBar() {
  const list = (window.__cgtiaActivePromos || []).filter((p) => !p.hibernated && p.active !== false);
  if (!list.length) {
    const b = document.getElementById("cgtiaPromoBell");
    if (b) b.remove();
    const s = document.getElementById("cgtiaPromoSheet");
    if (s) s.remove();
    return;
  }

  // Remove any full-width bottom bar leftover
  const oldBar = document.getElementById("cgtiaPromoBottomBar");
  if (oldBar) oldBar.remove();
  const stripe = document.getElementById("cgtiaPromoStripe");
  if (stripe) stripe.remove();

  let bell = document.getElementById("cgtiaPromoBell");
  if (!bell) {
    bell = document.createElement("button");
    bell.id = "cgtiaPromoBell";
    bell.type = "button";
    bell.setAttribute("aria-label", "View offer");
    bell.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"/></svg><span id="cgtiaPromoBellDot" style="position:absolute;top:6px;right:7px;width:9px;height:9px;background:#f43f5e;border-radius:999px;border:2px solid #0f172a"></span>';
    bell.style.cssText =
      "position:fixed;left:1.1rem;bottom:1.5rem;z-index:88;width:3.5rem;height:3.5rem;border-radius:999px;" +
      "background:#0f172a;color:#fff;border:1px solid rgba(255,255,255,.12);box-shadow:0 12px 28px rgba(15,23,42,.35);" +
      "display:flex;align-items:center;justify-content:center;cursor:pointer;" +
      "animation:cgtiaBellShake 2.2s ease-in-out infinite;";
    bell.onclick = function () {
      openPromoSheet(list);
    };
    document.body.appendChild(bell);
    if (!document.getElementById("cgtiaBellStyle")) {
      const st = document.createElement("style");
      st.id = "cgtiaBellStyle";
      st.textContent =
        "@keyframes cgtiaBellShake{0%,70%,100%{transform:rotate(0)}75%{transform:rotate(12deg)}80%{transform:rotate(-10deg)}85%{transform:rotate(8deg)}90%{transform:rotate(-6deg)}95%{transform:rotate(4deg)}}" +
        "@media(min-width:768px){#cgtiaPromoBell{bottom:1.75rem}}";
      document.head.appendChild(st);
    }
  }

  // Hide top sticky banner when minimized
  const top = document.getElementById("cgtiaPromoBanner");
  if (top) top.remove();
  window.__cgtiaPromoMinimized = true;
}

function openPromoSheet(list) {
  let sheet = document.getElementById("cgtiaPromoSheet");
  if (sheet) sheet.remove();
  sheet = document.createElement("div");
  sheet.id = "cgtiaPromoSheet";
  sheet.style.cssText =
    "position:fixed;inset:0;z-index:95;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;";
  const p = list[0] || {};
  const amount = p.promoAmount
    ? "₦" + (Number(p.promoAmount) >= 1000 ? Math.round(Number(p.promoAmount) / 1000) + "k" : p.promoAmount)
    : "";
  const body =
    '<div style="width:100%;max-width:28rem;background:#fff;border-radius:1.75rem 1.75rem 0 0;padding:1.25rem 1.35rem 2rem;box-shadow:0 -12px 40px rgba(0,0,0,.2)">' +
    '<div style="width:2.5rem;height:4px;background:#e2e8f0;border-radius:999px;margin:0 auto 1rem"></div>' +
    "<h3 style=\"font-size:1.15rem;font-weight:800;color:#0f172a;margin:0 0 .5rem\">" +
    (p.title || "Special offer") +
    "</h3>" +
    (amount ? '<p style="font-size:1.5rem;font-weight:800;color:#1e3a8a;margin:0 0 .5rem">' + amount + "</p>" : "") +
    '<p style="font-size:.9rem;color:#475569;line-height:1.5;margin:0 0 1.25rem">' +
    (p.description || "") +
    "</p>" +
    '<button type="button" id="cgtiaPromoSheetGo" style="width:100%;padding:0.95rem;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">View tuition</button>' +
    '<button type="button" id="cgtiaPromoSheetClose" style="width:100%;margin-top:.6rem;padding:.7rem;border:0;background:transparent;color:#64748b;font-size:12px;cursor:pointer">Close</button>' +
    "</div>";
  sheet.innerHTML = body;
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet) sheet.remove();
  });
  document.body.appendChild(sheet);
  const go = document.getElementById("cgtiaPromoSheetGo");
  const close = document.getElementById("cgtiaPromoSheetClose");
  if (close) close.onclick = function () { sheet.remove(); };
  if (go) {
    go.onclick = function () {
      sheet.remove();
      if (window.__cgtiaNavigate) window.__cgtiaNavigate("/tuition");
      else if (window.navigateWithPill) window.navigateWithPill("Tuition", "tuition.html");
      else window.location.href = "/tuition";
      setTimeout(function () {
        if (window.__cgtiaApplyTuitionPromoPricing) {
          window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
        }
      }, 400);
    };
  }
}

window.__cgtiaShowSolidBottomPromoBar = showSolidBottomPromoBar;
