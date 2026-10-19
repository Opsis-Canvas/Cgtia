function __cgtiaIsPortalPath(){ try { return /\/dashboard/i.test(location.pathname || ''); } catch(_){ return false; } }
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
      // Main website only — portal campaigns use showInPortal and must not appear here
      if (data.showOnSite === false) return;
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


function openPromoModal(promoList, startIdx) {
  const list = promoList || [];
  if (!list.length) return;
  let i = startIdx || 0;
  let modal = document.getElementById("cgtiaPromoModal");
  if (modal) modal.remove();
  modal = document.createElement("div");
  modal.id = "cgtiaPromoModal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;display:flex;align-items:flex-end;justify-content:center;" +
    "background:rgba(15,23,42,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
    "padding:16px;box-sizing:border-box;opacity:0;transition:opacity .25s ease";
  const sheet = document.createElement("div");
  sheet.style.cssText =
    "width:min(22rem,100%);max-height:min(80vh,32rem);overflow:auto;background:#fff;color:#0f172a;" +
    "border-radius:1.25rem;padding:1.25rem 1.25rem 1.4rem;box-shadow:0 24px 60px rgba(15,23,42,.35);" +
    "transform:translateY(16px);transition:transform .3s cubic-bezier(.16,1,.3,1)";
  function paintModal() {
    const p = list[i];
    if (!p) return;
    const progs = (Array.isArray(p.programs) ? p.programs : [p.programs]).filter(Boolean).map(programLabel);
    const amt = p.promoAmount ? formatNairaShort(p.promoAmount) : "";
    let ends = "";
    if (p.endsAt) {
      const ms = p.endsAt.toMillis ? p.endsAt.toMillis() : new Date(p.endsAt).getTime();
      if (ms) ends = countdownHtml(ms);
    }
    const dots = list.length > 1
      ? '<div style="display:flex;gap:6px;justify-content:center;margin:12px 0 4px">' +
        list.map(function (_, di) {
          return '<button type="button" data-m-dot="' + di + '" style="width:7px;height:7px;border-radius:50%;border:0;background:' +
            (di === i ? "#0f172a" : "#cbd5e1") + ';cursor:pointer;padding:0"></button>';
        }).join("") + "</div>"
      : "";
    const full = String(p.bellText || p.fullMessage || "").trim();
    const goLabel = p.bellButtonLabel || p.linkLabel || "View tuition";
    sheet.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
      '<span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1e3a8a">Promo</span>' +
      '<button type="button" data-m-close aria-label="Close" style="border:0;background:transparent;font-size:20px;line-height:1;color:#94a3b8;cursor:pointer;padding:0 2px">×</button></div>' +
      '<h3 style="margin:10px 0 6px;font-size:1.2rem;font-weight:800;line-height:1.25;color:#0f172a">' + esc2(p.title || "Offer") + "</h3>" +
      (amt ? '<p style="margin:0 0 8px;font-size:1.35rem;font-weight:800;color:#1e3a8a">' + esc2(amt) + "</p>" : "") +
      (progs.length ? '<p style="margin:0 0 6px;font-size:.85rem;color:#475569">' + esc2(progs.join(" · ")) + "</p>" : "") +
      (p.description ? '<p style="margin:0 0 8px;font-size:.9rem;color:#64748b;line-height:1.45">' + esc2(p.description) + "</p>" : "") +
      (full ? '<p style="margin:0 0 8px;font-size:.9rem;color:#334155;line-height:1.5;white-space:pre-wrap">' + esc2(full) + "</p>" : "") +
      (ends ? '<p style="margin:0 0 12px;font-size:.8rem;font-weight:600;color:#0f172a">Ends in ' + ends + "</p>" : "") +
      dots +
      '<button type="button" data-m-go style="width:100%;margin-top:8px;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px;cursor:pointer">' + esc2(goLabel) + "</button>";
    sheet.querySelector("[data-m-close]").onclick = closeModal;
    const go = sheet.querySelector("[data-m-go]");
    if (go) go.onclick = function () {
      closeModal();
      const url = (p.linkUrl || p.bellButtonUrl || "/tuition").trim() || "/tuition";
      if (url.indexOf("/") === 0) {
        if (window.__cgtiaNavigate) window.__cgtiaNavigate(url);
        else if (window.navigateWithPill && url.indexOf("tuition") >= 0) window.navigateWithPill("Tuition", "tuition.html");
        else window.location.href = url;
      } else {
        window.open(url, "_blank", "noopener");
      }
    };
    sheet.querySelectorAll("[data-m-dot]").forEach(function (btn) {
      btn.onclick = function () {
        i = Number(btn.getAttribute("data-m-dot"));
        paintModal();
      };
    });
  }
  function closeModal() {
    modal.style.opacity = "0";
    sheet.style.transform = "translateY(16px)";
    setTimeout(function () { if (modal.parentNode) modal.remove(); }, 250);
  }
  modal.onclick = function (e) { if (e.target === modal) closeModal(); };
  modal.appendChild(sheet);
  if (__cgtiaIsPortalPath()) return; document.body.appendChild(modal);
  paintModal();
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      modal.style.opacity = "1";
      sheet.style.transform = "translateY(0)";
    });
  });
}

function renderPromoBannerOnly(list) {
  const tuitionPromos = (list || []).filter((p) => p.type !== "announcement" && p.type !== "announcement_link");
  let bar = document.getElementById("cgtiaPromoBanner");
  if (!tuitionPromos.length) {
    if (bar) bar.remove();
    document.documentElement.style.setProperty("--cgtia-strip-h", "0px");
    if (window.__cgtiaPromoRotateTimer) { clearInterval(window.__cgtiaPromoRotateTimer); window.__cgtiaPromoRotateTimer = null; }
    ensureHeaderPromoChip(false);
    return;
  }
  if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1") {
    window.__cgtiaPromoMinimized = true;
    if (bar) bar.remove();
    document.documentElement.style.setProperty("--cgtia-strip-h", "0px");
    if (window.__cgtiaPromoRotateTimer) { clearInterval(window.__cgtiaPromoRotateTimer); window.__cgtiaPromoRotateTimer = null; }
    ensureHeaderPromoChip(true, tuitionPromos);
    return;
  }
  ensureHeaderPromoChip(false);

  // Build shell once: static "PROMO" label; only the middle text + CTA fades
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "cgtiaPromoBanner";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Tuition offers");
    document.body.prepend(bar);
    if (!document.getElementById("cgtiaPromoSpacer")) {
      const sp = document.createElement("div");
      sp.id = "cgtiaPromoSpacer";
      sp.style.height = "var(--cgtia-strip-h,0px)";
      document.body.prepend(sp);
    }
  }

  bar.style.cssText =
    "position:fixed;top:0;left:0;right:0;z-index:90;display:flex;align-items:center;gap:8px;" +
    "min-height:42px;padding:7px 10px 7px 12px;box-sizing:border-box;" +
    "background:linear-gradient(90deg,#0f172a 0%,#1e3a8a 100%);color:#fff;" +
    "font-size:12px;line-height:1.3;box-shadow:0 4px 16px rgba(15,23,42,.2)";

  if (!bar.querySelector("[data-promo-shell]")) {
    bar.innerHTML =
      '<span data-promo-shell style="flex-shrink:0;min-width:3.6rem;max-width:5.5rem;font-weight:800;font-size:10px;letter-spacing:.1em;text-transform:uppercase;opacity:.95;overflow:hidden;height:1.15rem;position:relative;display:inline-block">' +
      '<span data-promo-label style="display:block;transition:transform .45s ease,opacity .45s ease">Promo</span>' +
      '<span data-promo-timer-slot style="display:block;position:absolute;left:0;top:0;transform:translateY(110%);opacity:0;transition:transform .45s ease,opacity .45s ease;font-size:9px;letter-spacing:.04em;font-weight:700;white-space:nowrap"></span>' +
      '</span>' +
      '<div data-promo-stage style="flex:1;min-width:0;opacity:1;transition:opacity .35s ease"></div>' +
      '<div data-promo-dots style="display:flex;gap:4px;align-items:center;flex-shrink:0"></div>' +
      '<button type="button" data-promo-cta style="flex-shrink:0;border:0;border-radius:999px;background:#fff;color:#0f172a;font-size:10px;font-weight:700;padding:5px 10px;cursor:pointer;white-space:nowrap;opacity:1;transition:opacity .35s ease">View</button>' +
      '<button type="button" data-promo-close aria-label="Close" style="flex-shrink:0;background:transparent;border:0;color:rgba(255,255,255,.7);font-size:18px;line-height:1;cursor:pointer;padding:2px 4px">×</button>';
  }

  // Gap under strip so logo / APPLY sit below the promo bar
  document.documentElement.style.setProperty("--cgtia-strip-h", "48px");
  let spacer = document.getElementById("cgtiaPromoSpacer");
  if (!spacer) {
    spacer = document.createElement("div");
    spacer.id = "cgtiaPromoSpacer";
    document.body.prepend(spacer);
  }
  // Solid white block — no page content bleeding through under the strip
  spacer.style.cssText =
    "height:48px;width:100%;flex-shrink:0;pointer-events:none;" +
    "background:#ffffff;position:relative;z-index:89";
  let st = document.getElementById("cgtiaPromoGapStyle");
  if (!st) {
    st = document.createElement("style");
    st.id = "cgtiaPromoGapStyle";
    document.head.appendChild(st);
  }
  st.textContent =
    "html{scroll-padding-top:48px}" +
    "#cgtiaPromoBanner{background:linear-gradient(90deg,#0f172a 0%,#1e3a8a 100%)!important}" +
    ".faded-sticky-header{top:48px!important;position:sticky!important;background:rgba(255,255,255,.92)!important;" +
    "backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);z-index:88}" +
    "body{padding-top:0}";

  let idx = Number(window.__cgtiaPromoRotateIdx) || 0;
  if (idx >= tuitionPromos.length) idx = 0;
  window.__cgtiaPromoRotateIdx = idx;

  const stage = bar.querySelector("[data-promo-stage]");
  const dotsWrap = bar.querySelector("[data-promo-dots]");
  const cta = bar.querySelector("[data-promo-cta]");
  const closeBtn = bar.querySelector("[data-promo-close]");

  function goTuition(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    if (window.__cgtiaNavigate) window.__cgtiaNavigate("/tuition");
    else if (window.navigateWithPill) window.navigateWithPill("Tuition", "tuition.html");
    else window.location.href = "/tuition";
    setTimeout(function () {
      if (window.__cgtiaApplyTuitionPromoPricing) {
        window.__cgtiaApplyTuitionPromoPricing(window.__cgtiaActivePromos || []);
      }
    }, 400);
  }

  function fillContent(i, animate) {
    const p = tuitionPromos[i];
    if (!p || !stage) return;
    const progs = (Array.isArray(p.programs) ? p.programs : [p.programs]).filter(Boolean).map(programLabel);
    const label = progs.length ? progs.join(" · ") : (p.title || "Offer");
    const amt = p.promoAmount ? formatNairaShort(p.promoAmount) : "";
    const title = p.title || label;
    let timer = "";
    if (p.endsAt) {
      const ms = p.endsAt.toMillis ? p.endsAt.toMillis() : new Date(p.endsAt).getTime();
      if (ms) timer = countdownHtml(ms);
    }

    function write() {
      stage.innerHTML =
        '<div style="cursor:pointer" data-promo-open>' +
        '<div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700">' + esc2(title) +
        (amt ? ' · <span style="font-weight:800">' + esc2(amt) + "</span>" : "") + "</div>" +
        '<div style="font-size:10px;opacity:.8;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
        esc2(label) +
        "</div></div>";
      function openThis(e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        openPromoModal(tuitionPromos, i);
      }
      const goEl = stage.querySelector("[data-promo-open]");
      if (goEl) goEl.onclick = openThis;
      if (cta) cta.onclick = openThis;

      if (dotsWrap) {
        if (tuitionPromos.length > 1) {
          dotsWrap.innerHTML = tuitionPromos.map(function (_, di) {
            return '<button type="button" data-promo-dot="' + di + '" aria-label="Offer ' + (di + 1) + '" style="width:6px;height:6px;border-radius:50%;border:0;padding:0;cursor:pointer;background:' +
              (di === i ? "#fff" : "rgba(255,255,255,.35)") + '"></button>';
          }).join("");
          dotsWrap.querySelectorAll("[data-promo-dot]").forEach(function (btn) {
            btn.onclick = function (e) {
              e.preventDefault();
              e.stopPropagation();
              const di = Number(btn.getAttribute("data-promo-dot"));
              window.__cgtiaPromoRotateIdx = di;
              fillContent(di, true);
              restartRotate();
            };
          });
        } else {
          dotsWrap.innerHTML = "";
        }
      }
      tickCountdowns();

      // Left slot: show "Promo" briefly, then slide to live countdown for this offer
      const labelEl = bar.querySelector("[data-promo-label]");
      const timerSlot = bar.querySelector("[data-promo-timer-slot]");
      if (labelEl && timerSlot) {
        labelEl.style.transform = "translateY(0)";
        labelEl.style.opacity = "1";
        timerSlot.style.transform = "translateY(110%)";
        timerSlot.style.opacity = "0";
        // countdownHtml already emits <span data-promo-countdown="…">
        timerSlot.innerHTML = timer || "";
        clearTimeout(window.__cgtiaPromoLabelTimer);
        window.__cgtiaPromoLabelTimer = setTimeout(function () {
          if (!timer) return;
          labelEl.style.transform = "translateY(-110%)";
          labelEl.style.opacity = "0";
          timerSlot.style.transform = "translateY(0)";
          timerSlot.style.opacity = "1";
        }, 2200);
      }
    }

    if (animate && tuitionPromos.length > 1) {
      stage.style.opacity = "0";
      if (cta) cta.style.opacity = "0";
      setTimeout(function () {
        write();
        requestAnimationFrame(function () {
          stage.style.opacity = "1";
          if (cta) cta.style.opacity = "1";
        });
      }, 180);
    } else {
      write();
      stage.style.opacity = "1";
      if (cta) cta.style.opacity = "1";
    }
  }

  if (closeBtn) {
    closeBtn.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      sessionStorage.setItem("cgtiaPromoBannerClosed", "1");
      window.__cgtiaPromoMinimized = true;
      if (window.__cgtiaPromoRotateTimer) { clearInterval(window.__cgtiaPromoRotateTimer); window.__cgtiaPromoRotateTimer = null; }
      bar.style.transition = "transform .4s cubic-bezier(.16,1,.3,1)";
      bar.style.transform = "translateY(-100%)";
      setTimeout(function () {
        if (bar && bar.parentNode) bar.remove();
        document.documentElement.style.setProperty("--cgtia-strip-h", "0px");
        const sp2 = document.getElementById("cgtiaPromoSpacer");
        if (sp2) sp2.style.height = "0px";
        const st2 = document.getElementById("cgtiaPromoGapStyle");
        if (st2) st2.textContent = ".faded-sticky-header{top:0!important}";
        ensureHeaderPromoChip(true, tuitionPromos);
      }, 400);
    };
  }

  function restartRotate() {
    if (window.__cgtiaPromoRotateTimer) clearInterval(window.__cgtiaPromoRotateTimer);
    if (tuitionPromos.length > 1) {
      window.__cgtiaPromoRotateTimer = setInterval(function () {
        window.__cgtiaPromoRotateIdx = ((window.__cgtiaPromoRotateIdx || 0) + 1) % tuitionPromos.length;
        fillContent(window.__cgtiaPromoRotateIdx, true);
      }, 5500);
    }
  }

  fillContent(idx, false);
  restartRotate();

  if (!window.__cgtiaPromoTimer) {
    window.__cgtiaPromoTimer = setInterval(tickCountdowns, 1000);
  }
}

/** Small shimmer chip in the header area when the promo strip is closed */
function ensureHeaderPromoChip(show, promos) {
  let chip = document.getElementById("cgtiaPromoChip");
  if (!show) {
    if (chip) chip.remove();
    return;
  }
  if (!chip) {
    chip = document.createElement("button");
    chip.id = "cgtiaPromoChip";
    chip.type = "button";
    chip.setAttribute("aria-label", "Show tuition offers");
    chip.style.cssText =
      "position:fixed;top:max(10px,env(safe-area-inset-top));left:50%;z-index:91;" +
      "transform:translateX(-50%);" +
      "display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border:0;border-radius:999px;" +
      "background:linear-gradient(90deg,#0f172a,#1e3a8a,#0f172a);background-size:200% 100%;" +
      "color:#fff;font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;" +
      "cursor:pointer;box-shadow:0 6px 18px rgba(15,23,42,.3);" +
      "animation:cgtiaPromoShimmer 2.4s ease-in-out infinite,cgtiaPromoJiggle 3s ease-in-out infinite";
    if (!document.getElementById("cgtiaPromoChipStyle")) {
      const st = document.createElement("style");
      st.id = "cgtiaPromoChipStyle";
      st.textContent =
        "@keyframes cgtiaPromoShimmer{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}" +
        "@keyframes cgtiaPromoJiggle{0%,88%,100%{transform:translateX(-50%) rotate(0)}90%{transform:translateX(-50%) rotate(-6deg)}92%{transform:translateX(-50%) rotate(6deg)}94%{transform:translateX(-50%) rotate(-4deg)}96%{transform:translateX(-50%) rotate(4deg)}98%{transform:translateX(-50%) rotate(0)}}" +
        "@media (max-width:380px){#cgtiaPromoChip{top:max(8px,env(safe-area-inset-top));padding:5px 10px;font-size:9px}" +
        "#cgtiaAnnouncement{left:8px!important;bottom:8px!important;max-width:calc(100vw - 16px)!important}}";
      document.head.appendChild(st);
    }
    chip.onclick = function () {
      sessionStorage.removeItem("cgtiaPromoBannerClosed");
      window.__cgtiaPromoMinimized = false;
      chip.remove();
      renderPromoBanner(window.__cgtiaActivePromos || []);
    };
    document.body.appendChild(chip);
  }
  const n = (promos || []).length;
  chip.innerHTML = '<span style="width:6px;height:6px;border-radius:50%;background:#fbbf24;box-shadow:0 0 0 3px rgba(251,191,36,.25)"></span>Promo' + (n > 1 ? " · " + n : "");
}

/** Strikethrough full price + bold promo on tuition cards */
export function applyTuitionPromoPricing(list) {
  const byProgram = {};
  (list || []).forEach((p) => {
    if (p.type === "announcement" || p.type === "announcement_link") return;
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

export async function refreshPromoBannerLive() {
  try {
    const list = await loadActivePromotions();
    window.__cgtiaActivePromos = list;
    if (sessionStorage.getItem("cgtiaPromoBannerClosed") === "1") {
      window.__cgtiaPromoMinimized = true;
      if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
    } else {
      renderPromoBanner(list);
    }
    if (window.__cgtiaApplyTuitionPromoPricing) {
      window.__cgtiaApplyTuitionPromoPricing(list);
    }
  } catch (e) {
    console.warn("[cgtia] live promo refresh", e);
  }
}

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
  const list = (window.__cgtiaActivePromos || []).filter((p) => !p.hibernated && p.active !== false && (p.type === "announcement" || p.type === "announcement_link"));
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
  const items = (list || []).filter(function (p) { return p.type === "announcement" || p.type === "announcement_link"; });
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
  renderPromoBannerOnly(all.filter(function (p) { return p.type !== "announcement" && p.type !== "announcement_link"; }));
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

function openAnnouncementModal(pick) {
  if (!pick) return;
  let modal = document.getElementById("cgtiaAnnModal");
  if (modal) modal.remove();
  modal = document.createElement("div");
  modal.id = "cgtiaAnnModal";
  modal.style.cssText =
    "position:fixed;inset:0;z-index:200;display:flex;align-items:flex-end;justify-content:center;" +
    "background:rgba(15,23,42,.45);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);" +
    "padding:16px;box-sizing:border-box;opacity:0;transition:opacity .25s ease";
  const sheet = document.createElement("div");
  sheet.style.cssText =
    "width:min(22rem,100%);max-height:min(80vh,32rem);overflow:auto;background:#fff;color:#0f172a;" +
    "border-radius:1.25rem;padding:1.25rem;box-shadow:0 24px 60px rgba(15,23,42,.35);" +
    "transform:translateY(16px);transition:transform .3s cubic-bezier(.16,1,.3,1)";
  const full = String(pick.bellText || pick.fullMessage || pick.description || "").trim();
  const url = pick.linkUrl || pick.bellButtonUrl || "";
  const btnLabel = pick.linkLabel || pick.bellButtonLabel || "Open page";
  sheet.innerHTML =
    '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">' +
    '<span style="font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1e3a8a">Announcement</span>' +
    '<button type="button" data-a-close style="border:0;background:transparent;font-size:20px;color:#94a3b8;cursor:pointer;line-height:1">×</button></div>' +
    '<h3 style="margin:10px 0 8px;font-size:1.15rem;font-weight:800;line-height:1.3">' + esc2(pick.title || "Notice") + "</h3>" +
    '<p style="margin:0;font-size:.9rem;color:#475569;line-height:1.5;white-space:pre-wrap">' + esc2(full) + "</p>" +
    (url ? '<button type="button" data-a-go style="width:100%;margin-top:16px;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:12px;cursor:pointer">' + esc2(btnLabel) + "</button>" : "");
  function close() {
    modal.style.opacity = "0";
    sheet.style.transform = "translateY(16px)";
    setTimeout(function () { if (modal.parentNode) modal.remove(); }, 250);
  }
  sheet.querySelector("[data-a-close]").onclick = close;
  const go = sheet.querySelector("[data-a-go]");
  if (go) go.onclick = function () {
    close();
    if (url.indexOf("/") === 0) {
      if (window.__cgtiaNavigate) window.__cgtiaNavigate(url);
      else window.location.href = url;
    } else window.open(url, "_blank", "noopener");
  };
  modal.onclick = function (e) { if (e.target === modal) close(); };
  modal.appendChild(sheet);
  document.body.appendChild(modal);
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      modal.style.opacity = "1";
      sheet.style.transform = "translateY(0)";
    });
  });
}

function renderAnnouncement(all) {
  const anns = (all || []).filter(function (p) {
    return (p.type === "announcement" || p.type === "announcement_link") && p.id && shouldShowAnnouncement(p);
  });
  const existing = document.getElementById("cgtiaAnnouncement");
  if (!anns.length) {
    if (existing) existing.remove();
    if (window.__cgtiaAnnRotateTimer) { clearInterval(window.__cgtiaAnnRotateTimer); window.__cgtiaAnnRotateTimer = null; }
    window.__cgtiaAnnShown = false;
    if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
    return;
  }

  let idx = Number(window.__cgtiaAnnRotateIdx) || 0;
  if (idx >= anns.length) idx = 0;
  window.__cgtiaAnnRotateIdx = idx;

  function styleFor(pick) {
    const bg = pick.bgColor || pick.backgroundColor || "";
    const grad = pick.bgGradient || pick.gradient || "";
    let background;
    if (grad && grad.indexOf("gradient") >= 0) background = grad;
    else if (grad && grad.indexOf(",") >= 0) background = "linear-gradient(135deg," + grad + ")";
    else if (bg) background = bg;
    else background = "linear-gradient(135deg,#1e3a8a 0%,#0f172a 100%)";
    return {
      background: background,
      textColor: pick.textColor || "#ffffff",
      btnBg: pick.buttonColor || "#ffffff",
      btnFg: pick.buttonTextColor || "#0f172a"
    };
  }

  function ensureCard() {
    let card = document.getElementById("cgtiaAnnouncement");
    if (card) return card;
    card = document.createElement("div");
    card.id = "cgtiaAnnouncement";
    card.setAttribute("role", "status");
    card.style.cssText =
      "position:fixed;left:10px;bottom:10px;z-index:97;" +
      "width:min(16.5rem,calc(100vw - 20px));box-sizing:border-box;" +
      "border-radius:14px;padding:10px 12px 11px;" +
      "box-shadow:0 10px 28px rgba(15,23,42,.28);" +
      "font-size:12px;line-height:1.35;" +
      "transform:translateY(12px);opacity:0;" +
      "transition:transform .4s cubic-bezier(.16,1,.3,1),opacity .4s,background .35s ease";
    card.innerHTML =
      '<button type="button" aria-label="Close" data-ann-close style="position:absolute;right:6px;top:4px;background:transparent;border:0;color:inherit;opacity:.65;font-size:16px;line-height:1;cursor:pointer;padding:2px 5px">×</button>' +
      '<div data-ann-stage style="padding-right:18px;opacity:1;transition:opacity .3s ease"></div>' +
      '<div data-ann-dots style="display:flex;gap:4px;margin-top:8px"></div>';
    document.body.appendChild(card);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        card.style.transform = "translateY(0)";
        card.style.opacity = "1";
      });
    });
    return card;
  }

  function paintAnn(i, animate) {
    const pick = anns[i];
    if (!pick) return;
    const card = ensureCard();
    const st = styleFor(pick);
    card.style.background = st.background;
    card.style.color = st.textColor;
    card.dataset.id = pick.id;
    window.__cgtiaAnnShown = true;

    const stage = card.querySelector("[data-ann-stage]");
    const dots = card.querySelector("[data-ann-dots]");
    const title = esc2(pick.title || "Announcement");
    const desc = pick.description ? esc2(pick.description) : "";
    const fullMsg = String(pick.bellText || pick.fullMessage || "").trim();
    const label = esc2(pick.linkLabel || pick.bellButtonLabel || (fullMsg ? "Read more" : "Open"));
    const href = pick.linkUrl || pick.bellButtonUrl || "";
    // Full message → popup; otherwise direct link (or no button)
    const cta = (fullMsg || href)
      ? '<button type="button" data-ann-cta style="display:inline-block;margin-top:8px;padding:5px 12px;border-radius:999px;border:0;background:' + st.btnBg + ";color:" + st.btnFg + ';font-weight:700;font-size:10px;letter-spacing:.04em;cursor:pointer">' + label + "</button>"
      : "";
    const body =
      '<div style="font-weight:800;font-size:13px;line-height:1.25">' + title + "</div>" +
      (desc ? '<div style="margin-top:3px;opacity:.88;font-size:11px;line-height:1.35;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + desc + "</div>" : "") +
      cta;

    function write() {
      if (stage) stage.innerHTML = body;
      if (dots) {
        if (anns.length > 1) {
          dots.innerHTML = anns.map(function (_, di) {
            return '<button type="button" data-ann-dot="' + di + '" style="width:6px;height:6px;border-radius:50%;border:0;padding:0;cursor:pointer;background:' +
              (di === i ? "currentColor" : "rgba(255,255,255,.35)") + '"></button>';
          }).join("");
          dots.querySelectorAll("[data-ann-dot]").forEach(function (btn) {
            btn.onclick = function (e) {
              e.preventDefault();
              e.stopPropagation();
              window.__cgtiaAnnRotateIdx = Number(btn.getAttribute("data-ann-dot"));
              paintAnn(window.__cgtiaAnnRotateIdx, true);
              restartAnnRotate();
            };
          });
        } else {
          dots.innerHTML = "";
        }
      }
      const ctaEl = card.querySelector("[data-ann-cta]");
      if (ctaEl) {
        ctaEl.onclick = function (e) {
          e.preventDefault();
          e.stopPropagation();
          const full = String(pick.bellText || pick.fullMessage || "").trim();
          const url = pick.linkUrl || pick.bellButtonUrl || "";
          if (full) {
            openAnnouncementModal(pick);
            return;
          }
          if (url) {
            if (url.indexOf("/") === 0) {
              if (window.__cgtiaNavigate) window.__cgtiaNavigate(url);
              else window.location.href = url;
            } else {
              window.open(url, "_blank", "noopener");
            }
          }
        };
      }
    }

    if (animate && anns.length > 1 && stage) {
      stage.style.opacity = "0";
      setTimeout(function () {
        write();
        requestAnimationFrame(function () { stage.style.opacity = "1"; });
      }, 160);
    } else {
      write();
      if (stage) stage.style.opacity = "1";
    }

    const closeBtn = card.querySelector("[data-ann-close]");
    if (closeBtn) {
      closeBtn.onclick = function () {
        // Close current; mark seen; show next if any still eligible
        markAnnouncementSeen(pick);
        const rest = anns.filter(function (a) { return a.id !== pick.id && shouldShowAnnouncement(a); });
        if (rest.length) {
          window.__cgtiaAnnRotateIdx = 0;
          // re-render from full list
          if (window.__cgtiaAnnRotateTimer) { clearInterval(window.__cgtiaAnnRotateTimer); window.__cgtiaAnnRotateTimer = null; }
          renderAnnouncement(window.__cgtiaActivePromos || all);
          return;
        }
        card.style.transform = "translateY(12px)";
        card.style.opacity = "0";
        setTimeout(function () {
          card.remove();
          window.__cgtiaAnnShown = false;
          if (window.__cgtiaAnnRotateTimer) { clearInterval(window.__cgtiaAnnRotateTimer); window.__cgtiaAnnRotateTimer = null; }
          if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
        }, 280);
      };
    }
  }

  function restartAnnRotate() {
    if (window.__cgtiaAnnRotateTimer) clearInterval(window.__cgtiaAnnRotateTimer);
    if (anns.length > 1) {
      window.__cgtiaAnnRotateTimer = setInterval(function () {
        window.__cgtiaAnnRotateIdx = ((window.__cgtiaAnnRotateIdx || 0) + 1) % anns.length;
        paintAnn(window.__cgtiaAnnRotateIdx, true);
      }, 7000);
    }
  }

  paintAnn(idx, false);
  restartAnnRotate();
  if (window.__cgtiaShowSolidBottomPromoBar) window.__cgtiaShowSolidBottomPromoBar();
}

/* ---- One notification bell: opens a sheet with Announcements and Promotions sections ---- */
const BELL_SVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 22a2.5 2.5 0 002.45-2h-4.9A2.5 2.5 0 0012 22zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>';
const CHEVRON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="cgtia-chev"><polyline points="6 9 12 15 18 9"></polyline></svg>';

function promoItems(all) { return all.filter(function (p) { return p.type !== "announcement" && p.type !== "announcement_link" && !p.hibernated && p.active !== false && p.showOnSite !== false; }); }
function annItems(all) { return all.filter(function (p) { return (p.type === "announcement" || p.type === "announcement_link") && !p.hibernated && p.active !== false && p.showOnSite !== false; }); }

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
  const promos = promoItems(all);
  const hasPromo = promos.length > 0;
  // Tuition promos → header shimmer chip (not bottom bell)
  if (typeof ensureHeaderPromoChip === "function") {
    ensureHeaderPromoChip(promoClosed && hasPromo, promos);
  }
  // Bottom bell only if there are announcements waiting and no card is open
  const hasAnn = annItems(all).length > 0;
  if (window.__cgtiaAnnShown) { removeNotifyBell(); return; }
  // Prefer the compact announcement card over a generic bell when possible
  if (hasAnn && !window.__cgtiaAnnShown) {
    // card will render via renderAnnouncement; no need for bell
    removeNotifyBell();
    return;
  }
  removeNotifyBell();
}

function notifySection(title, rows, empty, startOpen) {
  const openAttr = startOpen ? " open" : "";
  return '<details' + openAttr + ' style="border-top:1px solid #e2e8f0;padding:.45rem 0">' +
    '<summary style="cursor:pointer;list-style:none;display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:.72rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#64748b;padding:.35rem 0">' +
    '<span>' + esc2(title) + (rows.length ? ' <span style="color:#94a3b8;font-weight:600">(' + rows.length + ')</span>' : '') + '</span>' + CHEVRON_SVG + "</summary>" +
    '<div style="padding:.15rem 0 .35rem">' + (rows.length ? rows.join("") : '<p style="color:#94a3b8;font-size:.85rem;margin:.2rem 0">' + esc2(empty) + "</p>") + "</div></details>";
}
function notifyRow(title, amount, body, label, dest) {
  const button = label && dest
    ? '<button type="button" data-notify-go="' + esc2(dest) + '" style="margin-top:.45rem;padding:.55rem 1rem;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;cursor:pointer">' + esc2(label) + "</button>"
    : "";
  return '<div style="padding:.55rem 0;border-top:1px solid #f1f5f9">' +
    '<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline">' +
    '<h3 style="font-size:.95rem;font-weight:700;color:#0f172a;margin:0">' + esc2(title || "Notice") + "</h3>" +
    (amount ? '<span style="font-size:.95rem;font-weight:800;color:#1e3a8a;white-space:nowrap">' + esc2(amount) + "</span>" : "") +
    "</div>" +
    (body ? '<p style="font-size:.82rem;color:#64748b;line-height:1.4;margin:.25rem 0 0">' + esc2(body) + "</p>" : "") +
    button + "</div>";
}

function openNotifySheet() {
  const all = window.__cgtiaActivePromos || [];
  const anns = annItems(all).map(function (p) {
    return notifyRow(p.title, "", p.bellText || p.description || "", p.bellButtonLabel || p.linkLabel || "Open", p.bellButtonUrl || p.linkUrl || "");
  });
  // One compact promo block (not three large cards)
  const promoList = promoItems(all);
  const promos = promoList.length
    ? [notifyRow(
        "Tuition offers",
        "",
        promoList.map(function (p) {
          const n = Number(p.promoAmount) || 0;
          const amt = n >= 1000 ? ("₦" + Math.round(n / 1000) + "k") : (n ? ("₦" + n) : "");
          const progs = (Array.isArray(p.programs) ? p.programs : [p.programs]).filter(Boolean).join("/") || p.title || "Offer";
          return progs + (amt ? " " + amt : "");
        }).join(" · "),
        "View tuition",
        "/tuition"
      )]
    : [];
  let sheet = document.getElementById("cgtiaNotifySheet");
  if (sheet) sheet.remove();
  sheet = document.createElement("div");
  sheet.id = "cgtiaNotifySheet";
  sheet.style.cssText = "position:fixed;inset:0;z-index:95;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;";
  sheet.innerHTML =
    "<style>.cgtia-chev{transition:transform .2s;flex:0 0 auto}details[open]>summary .cgtia-chev{transform:rotate(180deg)}summary::-webkit-details-marker{display:none}</style>" +
    '<div style="width:100%;max-width:26rem;background:#fff;border-radius:1.5rem 1.5rem 0 0;padding:1rem 1.15rem 1.4rem;box-shadow:0 -12px 40px rgba(0,0,0,.2);max-height:75vh;overflow:auto">' +
    '<div style="width:2.25rem;height:4px;background:#e2e8f0;border-radius:999px;margin:0 auto .85rem"></div>' +
    '<h2 style="font-size:1rem;font-weight:800;color:#0f172a;margin:0 0 .15rem">Notices</h2>' +
    '<p style="font-size:.75rem;color:#94a3b8;margin:0 0 .35rem">Tap a section to expand</p>' +
    notifySection("Announcements", anns, "No announcements right now.", anns.length === 1) +
    notifySection("Tuition offers", promos, "No offers right now.", promos.length === 1 && !anns.length) +
    '<button type="button" data-notify-close style="width:100%;margin-top:.35rem;padding:.65rem;border:0;background:transparent;color:#64748b;font-size:12px;cursor:pointer">Close</button></div>';
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
