/**
 * Buttons for open forms placed on a page in the admin's Forms tab.
 * Each button sits at the left, centre or right of the bottom of the page, as the admin chose.
 * Each button opens /apply-form?form=ID.
 */
const BAR_ID = "cgtiaFormLaunchers";

const SLOT_STYLE = {
  left: "justify-self:start;",
  centre: "justify-self:center;",
  right: "justify-self:end;"
};

export async function mountFormLaunchers(pathname) {
  const page = String(pathname || "/").replace(/\.html$/, "").replace(/\/+$/, "") || "/";
  const old = document.getElementById(BAR_ID);
  if (old) old.remove();
  if (page.indexOf("/apply-form") === 0 || page.indexOf("/dashboard") === 0) return;
  let forms = [];
  try {
    const res = await fetch("/api/open-forms?page=" + encodeURIComponent(page));
    const data = await res.json();
    forms = Array.isArray(data.forms) ? data.forms : [];
  } catch (e) {
    return;
  }
  if (!forms.length) return;

  const bar = document.createElement("div");
  bar.id = BAR_ID;
  bar.setAttribute("role", "navigation");
  bar.setAttribute("aria-label", "Application forms");
  bar.style.cssText = "position:fixed;left:0;right:0;bottom:calc(16px + env(safe-area-inset-bottom, 0px));z-index:60;display:grid;grid-template-columns:1fr auto 1fr;align-items:end;gap:10px;padding:0 16px;pointer-events:none;";

  ["left", "centre", "right"].forEach((slot) => {
    const cell = document.createElement("div");
    cell.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;pointer-events:none;" + SLOT_STYLE[slot];
    forms.filter((f) => (f.position || "centre") === slot).forEach((f) => {
      const a = document.createElement("a");
      a.href = "/apply-form?form=" + encodeURIComponent(f.id);
      a.textContent = f.label || "Apply";
      a.style.cssText = "pointer-events:auto;display:inline-block;background:#0f126c;color:#fff;border-radius:999px;padding:12px 20px;font:700 14px/1 Inter,system-ui,sans-serif;text-decoration:none;box-shadow:0 12px 24px -12px rgba(15,18,108,.6);white-space:nowrap;";
      cell.appendChild(a);
    });
    bar.appendChild(cell);
  });
  document.body.appendChild(bar);
}
