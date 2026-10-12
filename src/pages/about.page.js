/**
 * --------------------------------------------------------
 * File:        about.page.js
 * Purpose:     AboutPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { about_html } from "./content/about.content.js";

const html = htm.bind(createElement);

export const AboutPage = () => {
  return html`<${OriginalPage} markup=${about_html} />`;
};
