/**
 * Render programme cards from Firestore (admin CMS)
 */
function formatShort(n) {
  const v = Number(n) || 0;
  if (v >= 1000) return "₦" + (v % 1000 === 0 ? v / 1000 : (v / 1000).toFixed(1).replace(/\.0$/, "")) + "k";
  return "₦" + v;
}

function formatPrice(p) {
  if (p.priceText) return String(p.priceText);
  const n = Number(p.amount) || 0;
  return n > 0 ? "₦" + n.toLocaleString("en-NG") : "Free";
}

function cardHtml(p, withPromo) {
  const amount = formatPrice(p);
  const promo = withPromo && withPromo.promoAmount && !p.priceText ? withPromo : null;
  const priceBlock = promo
    ? `<div data-tuition-program="${p.id}" data-full-amount="${Number(p.amount) || 0}">
        <span data-tuition-price>
          <span style="text-decoration:line-through;opacity:.4;font-size:.55em;font-weight:500;margin-right:.35em">${amount}</span>
          <span style="font-weight:700">${formatShort(promo.promoAmount)}</span>
          <span style="display:block;font-size:11px;font-weight:400;color:#1e3a8a;margin-top:8px">${promo.title || "Promo"}</span>
        </span>
      </div>`
    : `<div data-tuition-program="${p.id}" data-full-amount="${Number(p.amount) || 0}">
        <span data-tuition-price class="font-editorial text-5xl font-bold text-blue-950 tracking-tight">${amount}</span>
      </div>`;

  const features = (Array.isArray(p.features) ? p.features : [p.feature1, p.feature2, p.feature3, p.feature4])
    .filter(Boolean)
    .map((f) => `<li class="flex items-center gap-3"><span class="w-2 h-2 rounded-full bg-blue-600 shadow-sm"></span> ${f}</li>`)
    .join("");

  const cta = p.ctaLabel || "Apply for This Program";
  const ctaAction = p.ctaAction === "licensing"
    ? `navigateWithPill('Licensing', 'licensing.html')`
    : p.ctaAction === "pay"
      ? `openProgramPayment('${p.id}')`
      : `toggleApplyScreen()`;

  const ribbon = p.ribbon
    ? `<div style="top:0;transform:translateY(-30%);z-index:20" class="absolute right-8 bg-blue-950 text-white text-[9px] font-bold tracking-widest uppercase px-4 py-1.5 rounded-full shadow-md">${p.ribbon}</div>`
    : "";
  return `<div class="relative pt-3">${ribbon}<div class="soft-component-card rounded-[2.5rem] p-8 md:p-10 border border-white/60 flex flex-col justify-between group smooth-transition bg-white/90 relative" data-program-card="${p.id}">
    <div>
      <div class="flex justify-between items-start mb-6">
        <div>
          <h3 class="font-editorial text-xl font-bold text-blue-950" data-tuition-headline>${p.headline || p.name || ""}</h3>
          <p class="text-xs text-slate-400 mt-1" data-tuition-body>${p.subtitle || ""}</p>
        </div>
        <span class="text-[10px] font-bold tracking-widest text-slate-400 uppercase px-3 py-1 bg-white/50 rounded-full" data-tuition-badge>${p.badge || p.levelLabel || ""}</span>
      </div>
      ${p.body ? `<p class="text-sm text-slate-500 font-light leading-relaxed mt-6">${String(p.body).replace(/&/g, "&amp;").replace(/</g, "&lt;")}</p>` : ""}
      <div class="my-8">${priceBlock}
        <span class="text-xs text-slate-400 ml-2 uppercase tracking-wider">${p.priceNote || ""}</span>
      </div>
      <ul class="space-y-4 pt-6 border-t border-slate-200/40 text-sm text-slate-500 font-light" data-tuition-bullets>
        ${features}
      </ul>
    </div>
    <button type="button" onclick="${ctaAction}" class="w-full mt-10 py-4 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase shadow-lg shadow-blue-950/20 hover:bg-blue-900 smooth-transition">${cta}</button>
  </div></div>`;
}

export function renderProgramCards(settings) {
  const programs = settings && settings.programs ? settings.programs : {};
  const promos = window.__cgtiaActivePromos || [];
  const byProg = {};
  promos.forEach((pr) => {
    if (pr.type === "announcement" || pr.requiresCode) return;
    (pr.programs || []).forEach((k) => { byProg[k] = pr; });
  });

  const sortKey = (p) => (Number(p.sortOrder) > 0 ? Number(p.sortOrder) : 9999);
  // Saved programmes replace the static cards in the page markup, on both pages
  if (Object.keys(programs).length) {
    document.querySelectorAll("[data-static-programs]").forEach((el) => el.remove());
  }
  const list = Object.keys(programs)
    .map((id) => ({ id, ...programs[id] }))
    .filter((p) => p.active !== false);

  list.sort((x, y) => sortKey(x) - sortKey(y));
  const home = list.filter((p) => p.showOnHome !== false);
  const tuition = list.filter((p) => p.showOnTuition !== false);

  const homeMount = document.getElementById("cgtiaHomeProgramCards");
  if (homeMount && home.length) {
    homeMount.innerHTML = home.map((p) => cardHtml(p, byProg[p.id])).join("");
    homeMount.style.display = "grid";
    // Hide older static tuition cards on home when CMS data is present
    document.querySelectorAll("#tuition [data-tuition-program]").forEach((el) => {
      const card = el.closest(".soft-component-card, .rounded-\\[2\\.5rem\\], .bg-white\\/90");
      if (card && !card.closest("#cgtiaHomeProgramCards")) card.remove();
    });
  }
  const tuitionMount = document.getElementById("cgtiaTuitionProgramCards");
  if (tuitionMount && tuition.length) {
    tuitionMount.innerHTML = tuition.map((p) => cardHtml(p, byProg[p.id])).join("");
    tuitionMount.style.display = "grid";
    document.querySelectorAll("#tuition [data-tuition-program]").forEach((el) => {
      const card = el.closest("div.soft-component-card, div.bg-white\\/90, div.rounded-\\[2\\.5rem\\]");
      if (card && !card.closest("#cgtiaTuitionProgramCards")) card.remove();
    });
  }
}
