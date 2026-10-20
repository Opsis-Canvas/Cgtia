
import { createElement, useEffect, useState } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
import { ImageSlot } from "./shared.js";
import { ASSETS } from "./assets.js";
const html = htm.bind(createElement);

/* One placeholder repeated as a swipe track along the bottom */
function LoadingCarousel() {
  const src = ASSETS.onboardingPerson.url;
  const N = 30;
  const [step, setStep] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setStep((v) => v + 1), 1400);
    return () => clearInterval(t);
  }, []);
  return html`<div class="ob-swipe" aria-hidden="true">
    <div class="ob-track" style=${{ width: (N * 100) + "%", transform: "translate3d(" + (-step * 100 / N) + "%,0,0)" }}>
      ${Array.from({ length: N }, (_, k) => html`<img key=${k} src=${src} alt="" style=${{ flex: "0 0 " + (100 / N) + "%" }} />`)}
    </div>
  </div>`;
}

/**
 * mode: "loading" — branded load screen (spinner, no CTA)
 * mode: "welcome" — first-visit onboarding (Get started)
 */
export function OnboardingView({ onStart, mode = "welcome" }) {
  const loading = mode === "loading";
  if (loading) {
    return html`<div class="ob ob-loading ob-splash" style=${{ position: "fixed", inset: 0, background: "#0f126c", overflow: "hidden" }}>
      <div class="ob-mark" aria-hidden="true">
        <img src=${ASSETS.logo} alt="" width="52" height="52" style=${{ width: 52, height: 52, objectFit: "contain" }} />
      </div>
      <div class="ob-brandline" aria-live="polite">
        <strong>CareEd</strong>
        <span>by CGTIA</span>
        <small>Getting your details ready…</small>
      </div>
      <${LoadingCarousel} />
    </div>`;
  }
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
