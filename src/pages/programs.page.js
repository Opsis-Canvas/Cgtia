/**
 * --------------------------------------------------------
 * File:        programs.page.js
 * Purpose:     ProgramsPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { programs_html } from "./content/programs.content.js";

const html = htm.bind(createElement);

export const ProgramsPage = () => {
  return html`<${OriginalPage} markup=${programs_html} />`;
};
