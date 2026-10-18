
import { createElement } from "react";
import htm from "htm";
const html = htm.bind(createElement);

export function OnboardingDesktop({ onStart }) {
  return html`<div class="obd">
    <section class="obd-copy">
      <span class="brand">CGTIA</span>
      <div class="obd-text">
        <h1 class="display">Your training<br />in one calm place</h1>
        <p>Courses, fees, and results — ready when you are.</p>
        <button class="obd-cta" onClick=${onStart}>Get started</button>
      </div>
    </section>
    <section class="obd-art" aria-hidden="true">
      <span class="obd-block b-blue"></span>
      <span class="obd-block b-yellow"></span>
      <span class="obd-block b-purple"></span>
      <span class="obd-block b-green"></span>
    </section>
  </div>`;
}
