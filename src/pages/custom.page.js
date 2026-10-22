/**
 * --------------------------------------------------------
 * File:        custom.page.js
 * Purpose:     CustomPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { custom_html } from "./content/custom.content.js";

const html = htm.bind(createElement);

export const CustomPage = () => {
  return html`<${OriginalPage} markup=${custom_html} />`;
};
