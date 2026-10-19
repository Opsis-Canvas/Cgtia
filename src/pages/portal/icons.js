
import { createElement } from "react";
import htm from "htm";
const html = htm.bind(createElement);
const PATHS = {
  menu: "M4 7h16M4 12h10M4 17h16",
  search: "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4",
  grid: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  book: "M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2zM4 19a2 2 0 0 0 2 2h12",
  chart: "M4 20h16M7 16v-5M12 16V8M17 16v-8",
  cal: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
  mail: "M4 6h16v12H4zM4 7l8 6 8-6",
  bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0",
  gear: "M19.4 13a1.7 1.7 0 0 0 .1-.9l1.7-1.3-1.6-2.8-2 .5a5.5 5.5 0 0 0-1.5-.9l-.4-2h-3.2l-.4 2a5.5 5.5 0 0 0-1.5.9l-2-.5-1.6 2.8 1.7 1.3a1.7 1.7 0 0 0 0 1.8l-1.7 1.3 1.6 2.8 2-.5c.5.4 1 .7 1.5.9l.4 2h3.2l.4-2c.5-.2 1-.5 1.5-.9l2 .5 1.6-2.8-1.7-1.3zM12 15.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4z",
  sun: "M12 4V2M12 22v-2M4.9 4.9L3.5 3.5M20.5 20.5l-1.4-1.4M4 12H2M22 12h-2M4.9 19.1L3.5 20.5M20.5 3.5l-1.4 1.4M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  moon: "M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z",
  arrow: "M5 12h14M13 6l6 6-6 6",
  back: "M15 18l-6-6 6-6",
  speaker: "M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14",
  check: "M20 6L9 17l-5-5",
  close: "M6 6l12 12M18 6L6 18",
  card: "M3 7h18v12H3zM3 11h18",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 20a8 8 0 0 1 16 0",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"
};
export function Icon({ name, size = 20 }) {
  return html`<svg class="icon" width=${size} height=${size} viewBox="0 0 24 24"
    fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"
    stroke-linejoin="round" aria-hidden="true"><path d=${PATHS[name] || PATHS.grid} /></svg>`;
}
