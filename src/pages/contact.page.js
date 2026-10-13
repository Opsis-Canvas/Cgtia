/**
 * ContactPage — loads admin-editable contact content from Firestore
 */
import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { contact_html } from "./content/contact.content.js";
import { getContactPage } from "../services/firebase.service.js";

const html = htm.bind(createElement);

export const ContactPage = () => {
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Warm cache
        const data = await getContactPage().catch(() => null);
        if (cancelled) return;
        if (data && typeof window.__cgtiaApplyContactPage === "function") {
          window.__cgtiaContactPageCache = data;
        }
        // Apply after markup is in the DOM
        const run = () => {
          if (typeof window.__cgtiaApplyContactPage === "function") {
            window.__cgtiaApplyContactPage();
          }
        };
        setTimeout(run, 50);
        setTimeout(run, 300);
        setTimeout(run, 800);
      } catch (e) {
        console.warn("ContactPage load", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return html`<${OriginalPage} markup=${contact_html} />`;
};
