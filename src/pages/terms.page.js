/**
 * --------------------------------------------------------
 * File:        terms.page.js
 * Purpose:     TermsPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { terms_html } from "./content/terms.content.js";

const html = htm.bind(createElement);

export const TermsPage = () => {
  return html`<${OriginalPage} markup=${terms_html} />`;
};
