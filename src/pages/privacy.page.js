/**
 * --------------------------------------------------------
 * File:        privacy.page.js
 * Purpose:     PrivacyPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { privacy_html } from "./content/privacy.content.js";

const html = htm.bind(createElement);

export const PrivacyPage = () => {
  return html`<${OriginalPage} markup=${privacy_html} />`;
};
