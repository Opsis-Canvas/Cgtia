
import { createElement } from "react";
import htm from "htm";
import { Icon } from "./icons.js";
const html = htm.bind(createElement);

export function OnboardingView({ onStart }) {
  return html`<div class="ob">
    <span class="ob-brand">CGTIA</span>
    <span class="ob-block b-blue" aria-hidden="true"></span>
    <span class="ob-block b-yellow" aria-hidden="true"></span>
    <span class="ob-block b-purple" aria-hidden="true"></span>
    <span class="ob-block b-green" aria-hidden="true"></span>
    <h1 class="display ob-title">Your training<br />in one<br />calm place</h1>
    <button class="ob-go" aria-label="Get started" onClick=${onStart}>
      ${Icon({ name: "arrow", size: 26 })}
    </button>
  </div>`;
}
