/**
 * --------------------------------------------------------
 * File:        tuition.page.js
 * Purpose:     TuitionPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { tuition_html } from "./content/tuition.content.js";

const html = htm.bind(createElement);

export const TuitionPage = () => {
  return html`<${OriginalPage} markup=${tuition_html} />`;
};
