/**
 * --------------------------------------------------------
 * File:        wall-of-fame.page.js
 * Purpose:     WallOfFamePage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { wall_of_fame_html } from "./content/wall-of-fame.content.js";

const html = htm.bind(createElement);

export const WallOfFamePage = () => {
  return html`<${OriginalPage} markup=${wall_of_fame_html} />`;
};
