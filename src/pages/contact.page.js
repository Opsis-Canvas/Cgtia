/**
 * --------------------------------------------------------
 * File:        contact.page.js
 * Purpose:     ContactPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { contact_html } from "./content/contact.content.js";

const html = htm.bind(createElement);

export const ContactPage = () => {
  return html`<${OriginalPage} markup=${contact_html} />`;
};
