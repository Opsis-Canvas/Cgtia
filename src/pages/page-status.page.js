/**
 * Shown in place of a page that is switched off in the admin.
 */
import { createElement } from "react";
import htm from "htm";

const html = htm.bind(createElement);

const DEFAULTS = {
  maintenance: {
    title: "We're updating this page",
    body: "This page is being updated. Please check back shortly."
  },
  notfound: {
    title: "Page not found",
    body: "The page you're looking for doesn't exist or has moved."
  }
};

export function PageStatus({ rule }) {
  const mode = rule.mode === "maintenance" || rule.mode === "notfound" ? rule.mode : "hidden";
  const d = DEFAULTS[mode] || { title: "", body: "" };
  const title = mode === "hidden" ? "" : rule.title || d.title;
  const body = mode === "hidden" ? "" : rule.message || d.body;
  return html`
    <div className="min-h-screen flex items-center justify-center px-6 bg-slate-50">
      <div className="max-w-md w-full text-center rounded-[2.5rem] bg-white border border-white/60 shadow-sm p-10">
        ${title ? html`<h1 className="font-editorial text-3xl font-bold text-blue-950 mb-4">${title}</h1>` : null}
        ${body ? html`<p className="text-slate-500 font-light leading-relaxed mb-8">${body}</p>` : null}
        <a href="/" className="inline-block px-8 py-3 rounded-full bg-blue-950 text-white text-xs font-semibold tracking-widest uppercase">Back to home</a>
      </div>
    </div>
  `;
}

/** Used for any address the site doesn't have */
export function NotFoundPage() {
  return html`<${PageStatus} rule=${{ mode: "notfound" }} />`;
}
