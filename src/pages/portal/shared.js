
import { createElement } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
const html = htm.bind(createElement);

export function Empty({ title, body }) {
  return html`<div class="empty">
    <h4>${title}</h4>
    <p>${body}</p>
  </div>`;
}

export function StatusChip({ status }) {
  const s = String(status || "").toLowerCase();
  let cls = "chip-status";
  if (/paid|complete|pass|active|ok/.test(s)) cls += " ok";
  else if (/pend|due|partial/.test(s)) cls += " warn";
  return html`<span class=${cls}>${status || "—"}</span>`;
}

export function NavList({ items, active, onSelect, buttonClass }) {
  return items.map((n) => html`
    <button key=${n.id} type="button"
      class=${(buttonClass || "") + (active === n.id ? " on" : "")}
      onClick=${() => onSelect(n.id)}>
      ${Icon({ name: n.icon, size: 18 })}<span>${n.label}</span>
    </button>
  `);
}

export function Avatar({ src, name, size }) {
  const initial = String(name || "S").charAt(0).toUpperCase();
  if (src) return html`<img class="avatar" src=${src} alt="" style=${size ? { width: size, height: size } : undefined} />`;
  return html`<div class="avatar" style=${{
    width: size || 40, height: size || 40, background: "var(--mist)",
    display: "grid", placeItems: "center", fontWeight: 800, fontSize: 14
  }}>${initial}</div>`;
}

/** PNG slot — exact box from assets.js; dashed placeholder until url is set */
export function ImageSlot({ asset, variant = "mobile", className = "" }) {
  if (!asset) return null;
  const box = asset[variant] || asset.mobile || {};
  const style = {};
  for (const k of ["width", "height", "left", "right", "top", "bottom"]) {
    if (box[k] !== undefined) style[k] = typeof box[k] === "number" ? box[k] + "px" : box[k];
  }
  if (asset.url) {
    return html`<img class=${"slot-img " + className} style=${style} src=${asset.url} alt=${asset.alt || ""} />`;
  }
  return html`<div class=${"slot is-empty " + className} style=${style} role="img" aria-label=${asset.alt || asset.name}>
    <span><b>${asset.name}</b><br />${box.width}×${box.height}</span>
  </div>`;
}

export function Skeleton({ rows = 3 }) {
  return html`<div class="skel-wrap" aria-hidden="true">
    <div class="skel skel-banner"></div>
    <div class="skel-row">
      <div class="skel skel-tile"></div>
      <div class="skel skel-tile"></div>
      <div class="skel skel-tile"></div>
    </div>
    ${Array.from({ length: rows }, (_, i) => html`<div key=${i} class="skel skel-line"></div>`)}
  </div>`;
}
