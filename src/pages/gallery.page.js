/**
 * --------------------------------------------------------
 * File:        gallery.page.js
 * Purpose:     GalleryPage — original visuals preserved
 * --------------------------------------------------------
 */

import { createElement } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { gallery_html } from "./content/gallery.content.js";

const html = htm.bind(createElement);

export const GalleryPage = () => {
  return html`<${OriginalPage} markup=${gallery_html} />`;
};
