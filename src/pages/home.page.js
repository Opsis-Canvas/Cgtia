/**
 * --------------------------------------------------------
 * File:        home.page.js
 * Purpose:     HomePage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { index_html } from "./content/index.content.js";

const html = htm.bind(createElement);

export const HomePage = () => {
  return html`<${OriginalPage} markup=${index_html} />`;
};
