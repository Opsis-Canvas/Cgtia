
import { createElement } from "react";
import htm from "htm";
import { ImageSlot } from "./shared.js";
import { ASSETS } from "./assets.js";
const html = htm.bind(createElement);

export function OnboardingDesktop({ onStart, mode = "welcome" }) {
  const loading = mode === "loading";
  return html`<div class="obd">
    <section class="obd-copy">
      <span class="brand">CGTIA</span>
      <div class="obd-text">
        <h1 class="display">Your training<br />in one calm place</h1>
        <p>Courses, fees, and results — ready when you are.</p>
        ${loading
          ? html`<div class="obd-load" aria-live="polite">
              <div class="ob-spin" aria-hidden="true"></div>
              <span>Opening your portal…</span>
            </div>`
          : html`<button class="obd-cta" onClick=${onStart}>Get started</button>`}
      </div>
    </section>
    <section class="obd-art" aria-hidden="true">
      <span class="obd-block b-blue"></span>
      <span class="obd-block b-yellow"></span>
      <span class="obd-block b-purple"></span>
      <span class="obd-block b-green"></span>
      <${ImageSlot} asset=${ASSETS.onboardingPerson} variant="desktop" className="obd-person" />
    </section>
  </div>`;
}
