/**
 * --------------------------------------------------------
 * File:        dashboard.page.js
 * Purpose:     DashboardPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { dashboard_html } from "./content/dashboard.content.js";

const html = htm.bind(createElement);

export const DashboardPage = () => {
  return html`<${OriginalPage} markup=${dashboard_html} />`;
};
