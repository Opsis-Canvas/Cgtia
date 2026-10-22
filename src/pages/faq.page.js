import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { faq_html } from "./content/faq.content.js";
const html = htm.bind(createElement);

function bindFaq() {
  const root = document.getElementById("faqAccordion");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.addEventListener("click", (e) => {
    const btn = e.target.closest(".faq-q");
    if (!btn || !root.contains(btn)) return;
    const item = btn.closest(".faq-item");
    const ans = item.querySelector(".faq-a");
    const chev = item.querySelector(".faq-chev");
    const open = !ans.classList.contains("hidden");
    root.querySelectorAll(".faq-a").forEach((a) => a.classList.add("hidden"));
    root.querySelectorAll(".faq-chev").forEach((c) => { c.textContent = "+"; });
    if (!open) {
      ans.classList.remove("hidden");
      if (chev) chev.textContent = "−";
    }
  });
}

export const FaqPage = () => {
  useEffect(() => {
    const t = setTimeout(bindFaq, 50);
    return () => clearTimeout(t);
  }, []);
  return html`<${OriginalPage} markup=${faq_html} />`;
};
