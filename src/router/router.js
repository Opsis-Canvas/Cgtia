/**
 * --------------------------------------------------------
 * File:        router.js
 * Purpose:     History API router (buildless) — supports lazy page loaders
 * --------------------------------------------------------
 */
export function createRouter(routeTable, renderFn) {
  function normalize(path) {
    if (!path || path === "") return "/";
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path;
  }

  function match(path) {
    const n = normalize(path);
    if (routeTable[n]) return routeTable[n];
    const noHtml = n.replace(/\.html$/, "");
    if (routeTable[noHtml]) return routeTable[noHtml];
    return routeTable["/"] || null;
  }

  async function renderCurrent() {
    const loader = match(window.location.pathname);
    if (!loader) return;
    try {
      // loader is either a component or an async function returning a component
      const Page = typeof loader === "function" ? await loader() : loader;
      if (Page) renderFn(Page);
    } catch (err) {
      console.error("Route load failed", err);
    }
  }

  function navigate(to, { replace = false } = {}) {
    const target = normalize(to);
    if (replace) window.history.replaceState({}, "", target);
    else window.history.pushState({}, "", target);
    renderCurrent();
  }

  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    const href = a.getAttribute("href");
    if (!href) return;
    if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#") || a.target === "_blank") return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (href.endsWith(".html") || href.startsWith("/") || !href.includes("://")) {
      e.preventDefault();
      let path = href;
      if (path.endsWith(".html")) {
        path = path.replace(/\.html$/, "");
        if (path === "index" || path === "/index") path = "/";
        if (!path.startsWith("/")) path = "/" + path;
      }
      const label = a.getAttribute("data-pill-label") || (a.textContent || "").trim() || "Loading";
      if (typeof window.navigateWithPill === "function") {
        window.navigateWithPill(label, path);
      } else {
        navigate(path);
      }
    }
  });

  window.addEventListener("popstate", () => {
    renderCurrent();
  });
  renderCurrent();
  return { navigate, renderCurrent };
}
