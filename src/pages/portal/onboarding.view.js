
import { createElement } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { ImageSlot } from "./shared.js";
import { ASSETS } from "./assets.js";
const html = htm.bind(createElement);

/**
 * mode: "loading" — branded load screen (spinner, no CTA)
 * mode: "welcome" — first-visit onboarding (Get started)
 */
export function OnboardingView({ onStart, mode = "welcome" }) {
  const loading = mode === "loading";
  return html`<div class="ob">
    <span class="ob-brand">CGTIA</span>
    <span class="ob-block b-blue" aria-hidden="true"></span>
    <span class="ob-block b-yellow" aria-hidden="true"></span>
    <span class="ob-block b-purple" aria-hidden="true"></span>
    <span class="ob-block b-green" aria-hidden="true"></span>
    <h1 class="display ob-title">Your training<br />in one<br />calm place</h1>
    <${ImageSlot} asset=${ASSETS.onboardingPerson} className="ob-person" />
    ${loading
      ? html`<div class="ob-load" aria-live="polite">
          <div class="ob-spin" aria-hidden="true"></div>
          <span>Getting your details ready…</span>
          <small style=${{ display: "block", marginTop: 6, opacity: 0.7, fontSize: 12 }}>Modules, results and fees</small>
        </div>`
      : html`<button class="ob-go" aria-label="Get started" onClick=${onStart}>
          ${Icon({ name: "arrow", size: 26 })}
        </button>`}
  </div>`;
}
