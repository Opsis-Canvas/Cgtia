/**
 * --------------------------------------------------------
 * File:        wall-of-fame.service.js
 * Purpose:     Honorees + graduates with fallbacks + viewport shimmer
 * --------------------------------------------------------
 */

export const STATIC_WALL_OF_FAME = [
  { year: "2025", rank: 1, studentName: "Adaobi Nwosu", program: "CGTIA Diploma", quote: "CGTIA turned my willingness to help into real skill.", photoUrl: "" },
  { year: "2025", rank: 2, studentName: "Chinedu Okeke", program: "CGTIA Certificate", quote: "", photoUrl: "" },
  { year: "2025", rank: 3, studentName: "Ngozi Eze", program: "CGTIA Higher Diploma", quote: "", photoUrl: "" },
  { year: "2025", rank: 4, studentName: "Ifeoma Bello", program: "CGTIA Certificate", quote: "", photoUrl: "" }
];

export const STATIC_GRADUATES = [
  { studentName: "Blessing Okafor", program: "Certificate", year: "2025", activity: "Home care internship — Owerri", photoUrl: "" },
  { studentName: "Ifeanyi Umeh", program: "Diploma", year: "2025", activity: "Clinical lab practice", photoUrl: "" },
  { studentName: "Amaka Chukwu", program: "Certificate", year: "2025", activity: "Partner care home placement", photoUrl: "" },
  { studentName: "Emeka Nwankwo", program: "Diploma", year: "2024", activity: "Community outreach", photoUrl: "" },
  { studentName: "Chioma Adebayo", program: "Higher Diploma", year: "2024", activity: "Supervised facility placement", photoUrl: "" },
  { studentName: "Tobi Adeyemi", program: "Certificate", year: "2024", activity: "Patient handling skills lab", photoUrl: "" },
  { studentName: "Hassan Yusuf", program: "Diploma", year: "2024", activity: "Private household internship", photoUrl: "" },
  { studentName: "Funke Ade", program: "Certificate", year: "2024", activity: "Care home rotation", photoUrl: "" }
];

function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function tryFirebaseCollection(name) {
  try {
    if (!window.__cgtiaFirestore) return null;
    const { collection, getDocs } = window.__cgtiaFirestoreApi || {};
    if (!collection || !getDocs) return null;
    const snap = await getDocs(collection(window.__cgtiaFirestore, name));
    const items = [];
    snap.forEach((d) => items.push({ id: d.id, ...d.data() }));
    return items.length ? items : null;
  } catch (e) {
    return null;
  }
}

export async function getWallOfFameEntries() {
  return (await tryFirebaseCollection("wallOfFame")) || STATIC_WALL_OF_FAME;
}

export async function getGraduates() {
  return (await tryFirebaseCollection("graduates")) || STATIC_GRADUATES;
}

function shimmerCard(dark) {
  const bg = dark ? "bg-white/10 border-white/10" : "bg-white border-slate-100";
  const block = dark ? "bg-white/10" : "bg-slate-200/80";
  return (
    `<div class="shimmer-card rounded-[1.75rem] overflow-hidden border ${bg}" aria-hidden="true">` +
    `<div class="aspect-[4/5] ${block} shimmer-anim"></div>` +
    `<div class="p-4 space-y-2">` +
    `<div class="h-3 w-2/3 rounded ${block} shimmer-anim"></div>` +
    `<div class="h-2.5 w-1/2 rounded ${block} shimmer-anim"></div>` +
    `</div></div>`
  );
}

function renderShimmerGrid(count, dark) {
  return Array.from({ length: count }, () => shimmerCard(dark)).join("");
}

export function renderCompactHonoreeCard(entry) {
  const rankLabels = { 1: "Best Graduating Student", 2: "2nd Best", 3: "3rd Best", 4: "Honoree" };
  const initial = escapeHtml((entry.studentName || "?").charAt(0));
  const photo = entry.photoUrl
    ? `<img src="${escapeHtml(entry.photoUrl)}" alt="${escapeHtml(entry.studentName)}" class="w-full h-full object-cover">`
    : `<div class="w-full h-full flex items-center justify-center text-2xl font-editorial font-bold text-white/40">${initial}</div>`;
  return (
    `<a href="/wall-of-fame" class="block bg-white/10 rounded-[1.75rem] overflow-hidden border border-white/10 hover:bg-white/15 transition-colors">` +
    `<div class="aspect-square bg-white/5 overflow-hidden">${photo}</div>` +
    `<div class="p-4">` +
    `<p class="text-[10px] font-bold tracking-widest uppercase text-blue-200 mb-1">${escapeHtml(rankLabels[entry.rank] || "Honoree")}</p>` +
    `<h4 class="font-editorial text-base font-bold text-white">${escapeHtml(entry.studentName || "")}</h4>` +
    `<p class="text-xs text-blue-100/70">${escapeHtml(entry.program || "")}${entry.year ? " · " + escapeHtml(entry.year) : ""}</p>` +
    `</div></a>`
  );
}

export function renderGraduateCard(g) {
  const initial = escapeHtml((g.studentName || "?").charAt(0));
  const photo = g.photoUrl
    ? `<img src="${escapeHtml(g.photoUrl)}" alt="${escapeHtml(g.studentName)}" class="w-full h-full object-cover">`
    : `<div class="w-full h-full flex items-center justify-center text-3xl font-editorial font-bold text-slate-300">${initial}</div>`;
  return (
    `<a href="/wall-of-fame" class="block soft-component-card rounded-[2rem] overflow-hidden border border-white/60 hover:shadow-md transition-shadow">` +
    `<div class="aspect-[4/5] bg-slate-100 overflow-hidden">${photo}</div>` +
    `<div class="p-5">` +
    `<h4 class="font-editorial text-base font-bold text-blue-950">${escapeHtml(g.studentName)}</h4>` +
    `<p class="text-xs text-slate-400 mb-2">${escapeHtml(g.program || "")}${g.year ? " · " + escapeHtml(g.year) : ""}</p>` +
    (g.activity ? `<p class="text-xs text-slate-500 font-light leading-relaxed">${escapeHtml(g.activity)}</p>` : "") +
    `</div></a>`
  );
}

/**
 * When section enters viewport → show shimmer briefly → load data → render.
 * Shimmer does NOT run until the block is in view.
 */
function observeAndLoad(el, { shimmerHtml, load }) {
  if (!el) return;
  let started = false;
  const run = async () => {
    if (started) return;
    started = true;
    el.innerHTML = shimmerHtml;
    // Brief shimmer so users can see it (also covers real network later)
    await new Promise((r) => setTimeout(r, 650));
    try {
      await load();
    } catch (e) {
      console.warn("section load", e);
      el.innerHTML = `<p class="text-center text-sm text-slate-400 py-8 col-span-full">Unable to load right now.</p>`;
    }
  };

  if (typeof IntersectionObserver === "undefined") {
    run();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          io.disconnect();
          run();
        }
      });
    },
    { root: null, rootMargin: "80px", threshold: 0.12 }
  );
  io.observe(el);
}

export async function hydrateWallOfFameUI() {
  const homeWoF = document.getElementById("homeWallOfFamePreview");
  if (homeWoF) {
    // Mobile: 2×2 (4 cards). Desktop: up to 3–4 in a row.
    homeWoF.className = "relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5";
    observeAndLoad(homeWoF, {
      shimmerHtml: renderShimmerGrid(4, true),
      load: async () => {
        const entries = await getWallOfFameEntries();
        const top = entries
          .slice()
          .sort((a, b) => (a.rank || 99) - (b.rank || 99))
          .slice(0, 4);
        homeWoF.innerHTML =
          top.map((e) => renderCompactHonoreeCard(e)).join("") ||
          `<p class="text-blue-200 text-sm col-span-full text-center py-6">Our Wall of Fame is being prepared — check back soon.</p>`;
      }
    });
  }

  const homeGrads = document.getElementById("homeGraduatesPreview");
  if (homeGrads) {
    homeGrads.className = "grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6";
    observeAndLoad(homeGrads, {
      shimmerHtml: renderShimmerGrid(4, false),
      load: async () => {
        const grads = await getGraduates();
        homeGrads.innerHTML =
          grads.slice(0, 8).map((g) => renderGraduateCard(g)).join("") ||
          `<p class="text-center text-sm text-slate-400 py-12 col-span-full">Graduates will appear here once published.</p>`;
      }
    });
  }

  const wallContainer = document.getElementById("wallOfFameContainer");
  const wallLoading = document.getElementById("wallOfFameLoading");
  if (wallContainer) {
    observeAndLoad(wallContainer, {
      shimmerHtml: `<div class="grid grid-cols-2 md:grid-cols-3 gap-5">${renderShimmerGrid(6, false)}</div>`,
      load: async () => {
        const entries = await getWallOfFameEntries();
        const byYear = {};
        entries.forEach((e) => {
          const y = e.year || "Recent";
          (byYear[y] = byYear[y] || []).push(e);
        });
        let html = "";
        Object.keys(byYear)
          .sort((a, b) => String(b).localeCompare(String(a)))
          .forEach((year) => {
            const group = byYear[year].sort((a, b) => (a.rank || 99) - (b.rank || 99));
            html += `<div class="mb-16 md:mb-20"><h2 class="font-editorial text-2xl md:text-3xl text-blue-950 font-bold mb-8">Class of ${escapeHtml(year)}</h2>`;
            html += `<div class="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">`;
            group.forEach((e) => {
              html += renderCompactHonoreeCard(e)
                .replace(/bg-white\/10/g, "soft-component-card border border-white/60")
                .replace(/text-white/g, "text-blue-950")
                .replace(/text-blue-200/g, "text-slate-400")
                .replace(/text-blue-100\/70/g, "text-slate-500")
                .replace(/bg-white\/5/g, "bg-slate-100")
                .replace(/hover:bg-white\/15/g, "hover:shadow-md");
            });
            html += `</div></div>`;
          });
        wallContainer.innerHTML =
          html ||
          `<p class="text-center text-sm text-slate-400 py-16">Our Wall of Fame is being prepared — check back soon.</p>`;
        if (wallLoading) wallLoading.classList.add("hidden");
      }
    });
  }

  const gradGrid = document.getElementById("graduatesGrid");
  if (gradGrid) {
    observeAndLoad(gradGrid, {
      shimmerHtml: renderShimmerGrid(8, false),
      load: async () => {
        const grads = await getGraduates();
        gradGrid.innerHTML =
          grads.map((g) => renderGraduateCard(g)).join("") ||
          `<p class="text-center text-sm text-slate-400 py-12 col-span-full">Graduates will appear here once published.</p>`;
      }
    });
  }
}
