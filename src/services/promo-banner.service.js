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
  const s = window.__cgtiaSiteSettings;
  if (s && s.programs && s.programs[key] && s.programs[key].name) return s.programs[key].name;
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
      if (data.trashed === true) return;
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

function renderPromoBannerOnly(list) {
  let bar = document.getElementById("cgtiaPromoBanner");
  if (!list || !list.length) {
    if (bar) bar.remove();
    document.documentElement.style.setProperty("--cgtia-strip-h", "0px");
    return;
  }
  if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1") {
    window.__cgtiaPromoMinimized = true;
    const barNow = document.getElementById("cgtiaPromoBanner");
    if (barNow) barNow.remove();
    document.documentElement.style.setProperty("--cgtia-strip-h", "0px");
    if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
    return;
  }
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "cgtiaPromoBanner";
    bar.setAttribute(
      "style",
      "position:fixed;top:0;left:0;right:0;z-index:90;background:#0f172a;color:#fff;padding:12px 18px;font-size:13px;line-height:1.5;transform:translateY(-100%);transition:transform 0.55s cubic-bezier(0.16,1,0.3,1);cursor:pointer;"
    );
    bar.addEventListener("click", function (e) {
      if (e.target && e.target.closest && e.target.closest("[data-promo-close],[data-promo-expand],[data-promo-collapse]")) return;
      // Close top banner and show solid bottom bar after navigation
      window.__cgtiaPromoMinimized = true;
      if (window.__cgtiaNavigate) window.__cgtiaNavigate("/tuition");
      else if (window.navigateWithPill) window.navigateWithPill("Tuition", "tuition.html");
      else window.location.href = "/tuition";
      setTimeout(function () {
        /* promotions do not use the bell */
        if (window.__cgtiaApplyTuitionPromoPricing) {
          window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
        }
      }, 400);
    });
    document.body.prepend(bar);
    if (!document.getElementById("cgtiaPromoSpacer")) {
      const sp = document.createElement("div");
      sp.id = "cgtiaPromoSpacer";
      sp.style.height = "var(--cgtia-strip-h,0px)";
      document.body.prepend(sp);
    }
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

  // Full banner + thin strip: the strip shows after scrolling, so the header stays visible
  const fullHtml = bar.innerHTML;
  bar.innerHTML =
    '<div data-promo-full style="position:relative">' + fullHtml +
    '<button type="button" data-promo-collapse aria-label="Collapse" style="position:absolute;left:0;bottom:-4px;background:transparent;border:0;color:#94a3b8;cursor:pointer;padding:2px;display:flex;align-items:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 15 12 9 18 15"></polyline></svg></button></div>' +
    '<div data-promo-strip style="display:none;align-items:center;justify-content:space-between;gap:10px;height:34px">' +
    '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:12px">' +
    esc2((list || []).map(function (p) { return p.title || "Offer"; }).join(" · ")) + "</span>" +
    '<button type="button" data-promo-expand aria-label="Show offer" style="background:transparent;border:0;color:#fff;cursor:pointer;padding:2px 4px;display:flex;align-items:center"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"></polyline></svg></button></div>';
  installPromoStrip(bar);
  if (window.__cgtiaSetPromoState) window.__cgtiaSetPromoState(window.scrollY < 40 ? "full" : "strip");
  bar.style.position = "fixed";
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
        document.documentElement.style.setProperty("--cgtia-strip-h", "0px");
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
function legacyBellUnused() {
  const list = (window.__cgtiaActivePromos || []).filter((p) => !p.hibernated && p.active !== false && p.type === "announcement");
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

function openPromoSheetLegacy(list) {
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


function esc2(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** Bell sheet: every live offer, each with its own message and button */
function openPromoSheet(list) {
  let sheet = document.getElementById("cgtiaPromoSheet");
  if (sheet) sheet.remove();
  sheet = document.createElement("div");
  sheet.id = "cgtiaPromoSheet";
  sheet.style.cssText = "position:fixed;inset:0;z-index:95;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;";
  const items = (list || []).filter(function (p) { return p.type === "announcement"; });
  const cards = items.map(function (p) {
    const label = p.bellButtonLabel || p.linkLabel || "";
    const dest = p.bellButtonUrl || p.linkUrl || "";
    const button = label && dest
      ? '<button type="button" data-promo-go="' + esc2(dest) + '" style="width:100%;padding:.85rem;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">' + esc2(label) + "</button>"
      : "";
    return '<div style="padding:.9rem 0;border-top:1px solid #e2e8f0">' +
      '<h3 style="font-size:1.05rem;font-weight:800;color:#0f172a;margin:0 0 .35rem">' + esc2(p.title || "Announcement") + "</h3>" +
      '<p style="font-size:.9rem;color:#475569;line-height:1.5;margin:0 0 .75rem">' + esc2(p.bellText || p.description || "") + "</p>" +
      button + "</div>";
  }).join("");
  sheet.innerHTML =
    '<div style="width:100%;max-width:28rem;background:#fff;border-radius:1.75rem 1.75rem 0 0;padding:1.25rem 1.35rem 2rem;box-shadow:0 -12px 40px rgba(0,0,0,.2);max-height:80vh;overflow:auto">' +
    '<div style="width:2.5rem;height:4px;background:#e2e8f0;border-radius:999px;margin:0 auto 1rem"></div>' +
    (cards || '<p style="color:#475569">Nothing new right now.</p>') +
    '<button type="button" id="cgtiaPromoSheetClose" style="width:100%;margin-top:.6rem;padding:.7rem;border:0;background:transparent;color:#64748b;font-size:12px;cursor:pointer">Close</button></div>';
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet || e.target.id === "cgtiaPromoSheetClose") { sheet.remove(); return; }
    const go = e.target.closest && e.target.closest("[data-promo-go]");
    if (!go) return;
    const url = go.getAttribute("data-promo-go");
    sheet.remove();
    if (url === "apply") {
      if (window.toggleApplyScreen) window.toggleApplyScreen();
      return;
    }
    if (url.indexOf("/") === 0) {
      if (window.__cgtiaNavigate) window.__cgtiaNavigate(url);
      else window.location.href = url;
    } else {
      window.open(url, "_blank", "noopener");
    }
  });
  document.body.appendChild(sheet);
}

/** Top bar: promotions only. Announcements have their own card. */
export function renderPromoBanner(list) {
  const all = list || [];
  renderPromoBannerOnly(all.filter(function (p) { return p.type !== "announcement"; }));
  setTimeout(function () { renderAnnouncement(all); }, 700);
}

/** Collapses the top bar into a strip after scrolling; the ▼ opens it again */
function installPromoStrip(bar) {
  if (window.__cgtiaStripInstalled) return;
  window.__cgtiaStripInstalled = true;
  const style = document.createElement("style");
  style.textContent = ".faded-sticky-header{top:var(--cgtia-strip-h,0px)!important}";
  document.head.appendChild(style);
  let expanded = false;
  let expandY = 0;
  const setState = function (state) {
    const el = document.getElementById("cgtiaPromoBanner");
    if (!el) return;
    const full = el.querySelector("[data-promo-full]");
    const strip = el.querySelector("[data-promo-strip]");
    if (!full || !strip) return;
    const showStrip = state === "strip";
    full.style.display = showStrip ? "none" : "block";
    strip.style.display = showStrip ? "flex" : "none";
    el.style.padding = showStrip ? "0 14px" : "12px 18px";
    el.dataset.state = state;
    requestAnimationFrame(function () {
      document.documentElement.style.setProperty("--cgtia-strip-h", "34px");
    });
  };
  window.__cgtiaSetPromoState = setState;
  window.addEventListener("scroll", function () {
    const y = window.scrollY || 0;
    if (y < 40) {
      expanded = false;
      setState("full");
      return;
    }
    if (expanded) {
      // The full banner stays open until the visitor scrolls down a little
      if (y - expandY > 40) {
        expanded = false;
        setState("strip");
      }
      return;
    }
    setState("strip");
  }, { passive: true });
  bar.addEventListener("click", function (e) {
    if (e.target.closest && e.target.closest("[data-promo-expand]")) { expanded = true; expandY = window.scrollY || 0; setState("full"); }
    if (e.target.closest && e.target.closest("[data-promo-collapse]")) { expanded = false; setState("strip"); }
  });
}

/** Announcements: a card at the bottom left, closed to the bell */
function announcementKey(a) {
  // The version changes whenever the announcement is saved again in the admin, so an edit shows again
  const u = a.updatedAt;
  const ms = u && u.toMillis ? u.toMillis() : (u ? new Date(u).getTime() : 0);
  return "cgtiaAnn:" + a.id + ":" + (ms || 0);
}
function shouldShowAnnouncement(a) {
  let rec = null;
  try { rec = JSON.parse(localStorage.getItem(announcementKey(a)) || "null"); } catch (e) { rec = null; }
  if (!rec || !rec.closedAt) return true;
  const hours = Number(a.repeatHours) || 0;
  if (!hours) return false;
  return Date.now() - rec.closedAt > hours * 3600000;
}
function markAnnouncementSeen(a) {
  try { localStorage.setItem(announcementKey(a), JSON.stringify({ closedAt: Date.now() })); } catch (e) { /* storage blocked */ }
}
function renderAnnouncement(all) {
  const anns = (all || []).filter(function (p) { return p.type === "announcement" && p.id; });
  const pick = anns.find(shouldShowAnnouncement);
  const existing = document.getElementById("cgtiaAnnouncement");
  if (!pick) {
    if (existing) existing.remove();
    window.__cgtiaAnnShown = false;
    if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
    return;
  }
  if (existing && existing.dataset.id === pick.id) { window.__cgtiaAnnShown = true; return; }
  if (existing) existing.remove();
  const card = document.createElement("div");
  card.id = "cgtiaAnnouncement";
  card.dataset.id = pick.id;
  card.setAttribute("role", "status");
  card.style.cssText =
    "position:fixed;left:12px;bottom:12px;z-index:97;width:min(20rem,calc(100vw - 24px));box-sizing:border-box;" +
    "background:#0f172a;color:#fff;border-radius:1.25rem;padding:1rem 2.25rem 1.1rem 1.1rem;box-shadow:0 18px 40px rgba(15,23,42,.35);" +
    "font-size:14px;line-height:1.5;transform:translateY(20px);opacity:0;transition:transform .5s cubic-bezier(.16,1,.3,1),opacity .5s";
  const link = pick.linkUrl
    ? '<a href="' + esc2(pick.linkUrl) + '" target="_blank" rel="noopener" style="display:inline-block;margin-top:.75rem;padding:.55rem 1rem;border-radius:999px;background:#fff;color:#0f172a;font-weight:700;font-size:12px;text-decoration:none">' + esc2(pick.linkLabel || "Read more") + "</a>"
    : "";
  card.innerHTML =
    '<button type="button" aria-label="Close" data-ann-close style="position:absolute;right:10px;top:8px;background:transparent;border:0;color:#94a3b8;font-size:20px;line-height:1;cursor:pointer">×</button>' +
    '<div style="font-weight:800;font-size:15px">' + esc2(pick.title || "Announcement") + "</div>" +
    (pick.description ? '<div style="margin-top:.35rem;color:#cbd5e1">' + esc2(pick.description) + "</div>" : "") +
    link;
  document.body.appendChild(card);
  window.__cgtiaAnnShown = true;
  if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      card.style.transform = "translateY(0)";
      card.style.opacity = "1";
    });
  });
  card.querySelector("[data-ann-close]").onclick = function () {
    markAnnouncementSeen(pick);
    card.remove();
    window.__cgtiaAnnShown = false;
    if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
  };
}


/* ---- One notification bell: opens a sheet with Announcements and Promotions sections ---- */
const BELL_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';
const CHEVRON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="cgtia-chev"><polyline points="6 9 12 15 18 9"></polyline></svg>';

function promoItems(all) { return all.filter(function (p) { return p.type !== "announcement" && !p.hibernated && p.active !== false; }); }
function annItems(all) { return all.filter(function (p) { return p.type === "announcement" && !p.hibernated && p.active !== false; }); }

function removeNotifyBell() {
  const b = document.getElementById("cgtiaNotifyBell");
  if (b) b.remove();
}
function ensureNotifyBell() {
  let b = document.getElementById("cgtiaNotifyBell");
  if (b) return;
  b = document.createElement("button");
  b.id = "cgtiaNotifyBell";
  b.type = "button";
  b.setAttribute("aria-label", "Notifications");
  b.innerHTML = BELL_SVG;
  b.style.cssText = "position:fixed;left:16px;bottom:16px;width:56px;height:56px;border-radius:50%;border:0;color:#fff;background:#0f172a;display:flex;align-items:center;justify-content:center;box-shadow:0 10px 25px rgba(15,23,42,.35);cursor:pointer;z-index:96";
  b.addEventListener("click", openNotifySheet);
  document.body.appendChild(b);
}

export function showSolidBottomPromoBar() {
  const all = window.__cgtiaActivePromos || [];
  const promoClosed = sessionStorage.getItem("cgtiaPromoBannerClosed") === "1";
  const hasPromo = promoItems(all).length > 0;
  const hasAnn = annItems(all).length > 0;
  // While an announcement card is on screen, it is the notification, so the bell waits
  if (window.__cgtiaAnnShown) { removeNotifyBell(); return; }
  const promoPending = promoClosed && hasPromo;
  const annPending = hasAnn;
  if (promoPending || annPending) ensureNotifyBell();
  else removeNotifyBell();
}

function notifySection(title, rows, empty) {
  return '<details open style="border-top:1px solid #e2e8f0;padding:.6rem 0">' +
    '<summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;font-size:.78rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#334155">' +
    esc2(title) + CHEVRON_SVG + "</summary>" +
    '<div style="padding-top:.5rem">' + (rows.length ? rows.join("") : '<p style="color:#64748b;font-size:.9rem;margin:.25rem 0">' + esc2(empty) + "</p>") + "</div></details>";
}
function notifyRow(title, amount, body, label, dest) {
  const button = label && dest
    ? '<button type="button" data-notify-go="' + esc2(dest) + '" style="width:100%;margin-top:.6rem;padding:.8rem;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">' + esc2(label) + "</button>"
    : "";
  return '<div style="padding:.7rem 0;border-top:1px solid #f1f5f9">' +
    '<h3 style="font-size:1rem;font-weight:800;color:#0f172a;margin:0 0 .25rem">' + esc2(title || "Notice") + "</h3>" +
    (amount ? '<p style="font-size:1.15rem;font-weight:800;color:#1e3a8a;margin:0 0 .25rem">' + esc2(amount) + "</p>" : "") +
    (body ? '<p style="font-size:.9rem;color:#475569;line-height:1.5;margin:0">' + esc2(body) + "</p>" : "") +
    button + "</div>";
}

function openNotifySheet() {
  const all = window.__cgtiaActivePromos || [];
  const anns = annItems(all).map(function (p) {
    return notifyRow(p.title, "", p.bellText || p.description || "", p.bellButtonLabel || p.linkLabel || "", p.bellButtonUrl || p.linkUrl || "");
  });
  const promos = promoItems(all).map(function (p) {
    const amount = p.promoAmount ? "\u20A6" + (Number(p.promoAmount) >= 1000 ? Math.round(Number(p.promoAmount) / 1000) + "k" : p.promoAmount) : "";
    return notifyRow(p.title, amount, p.bellText || p.description || "", p.bellButtonLabel || "View tuition", p.bellButtonUrl || "/tuition");
  });
  let sheet = document.getElementById("cgtiaNotifySheet");
  if (sheet) sheet.remove();
  sheet = document.createElement("div");
  sheet.id = "cgtiaNotifySheet";
  sheet.style.cssText = "position:fixed;inset:0;z-index:95;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;";
  sheet.innerHTML =
    "<style>.cgtia-chev{transition:transform .2s}details[open]>summary .cgtia-chev{transform:rotate(180deg)}summary::-webkit-details-marker{display:none}</style>" +
    '<div style="width:100%;max-width:28rem;background:#fff;border-radius:1.75rem 1.75rem 0 0;padding:1.1rem 1.25rem 1.6rem;box-shadow:0 -12px 40px rgba(0,0,0,.2);max-height:82vh;overflow:auto">' +
    '<div style="width:2.5rem;height:4px;background:#e2e8f0;border-radius:999px;margin:0 auto 1rem"></div>' +
    '<h2 style="font-size:1.1rem;font-weight:800;color:#0f172a;margin:0 0 .25rem">Notifications</h2>' +
    notifySection("Announcements", anns, "No announcements right now.") +
    notifySection("Promotions", promos, "No offers right now.") +
    '<button type="button" data-notify-close style="width:100%;margin-top:.5rem;padding:.7rem;border:0;background:transparent;color:#64748b;font-size:12px;cursor:pointer">Close</button></div>';
  sheet.addEventListener("click", function (e) {
    if (e.target === sheet || (e.target.closest && e.target.closest("[data-notify-close]"))) { sheet.remove(); return; }
    const go = e.target.closest && e.target.closest("[data-notify-go]");
    if (!go) return;
    const dest = go.getAttribute("data-notify-go");
    sheet.remove();
    if (dest === "apply") {
      if (window.toggleApplyScreen) window.toggleApplyScreen();
      return;
    }
    if (dest.indexOf("/") === 0) {
      if (window.__cgtiaNavigate) window.__cgtiaNavigate(dest);
      else window.location.href = dest;
    } else {
      window.open(dest, "_blank", "noopener");
    }
  });
  document.body.appendChild(sheet);
}

function reopenPromoBanner() {
  sessionStorage.removeItem("cgtiaPromoBannerClosed");
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderPromoBanner(window.__cgtiaActivePromos || []);
  showSolidBottomPromoBar();
}
window.__cgtiaShowSolidBottomPromoBar = showSolidBottomPromoBar;
