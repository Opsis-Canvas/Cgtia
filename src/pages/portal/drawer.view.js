
import { createElement, useEffect } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { Avatar, NavList } from "./shared.js";

const html = htm.bind(createElement);

export function MenuDrawer({ open, onClose, student, nav, section, onSelect, onLogout }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const name = student?.name || "Student";

  return html`<div class=${"drawer" + (open ? " open" : "")}>
    <div class="drawer-scrim" onClick=${onClose}></div>
    <aside class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden=${!open}>
      <div class="drawer-top">
        <span class="brand">CGTIA</span>
        <button class="icon-btn" aria-label="Close menu" onClick=${onClose}>${Icon({ name: "close", size: 18 })}</button>
      </div>
      <div class="drawer-profile">
        <${Avatar} src=${student?.avatar} name=${name} size=${52} />
        <div><b>${name}</b><small>${student?.role || "Student"}</small></div>
      </div>
      <nav class="drawer-nav" aria-label="Main">
        <${NavList} items=${nav} active=${section} onSelect=${(id) => { onSelect(id); onClose(); }} />
        <button type="button" onClick=${() => { onLogout(); onClose(); }}>
          ${Icon({ name: "logout", size: 18 })}<span>Log out</span>
        </button>
      </nav>
    </aside>
  </div>`;
}
