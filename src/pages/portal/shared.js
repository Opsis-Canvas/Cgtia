
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
