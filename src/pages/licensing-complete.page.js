import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { licensing_complete_html } from "./content/licensing-complete.content.js";

const html = htm.bind(createElement);

function install() {
  const mount = document.getElementById("licCompleteMount");
  if (!mount || mount.dataset.bound === "1") return;
  mount.dataset.bound = "1";
  const token = new URLSearchParams(window.location.search).get("token") || "";

  mount.innerHTML = `<p style="color:#64748b;font-size:.875rem">Checking invite…</p>`;

  (async () => {
    if (!token) {
      mount.innerHTML = `<div style="padding:1.5rem;border:1px solid #fde68a;background:#fffbeb;border-radius:1.25rem"><strong>Invite required</strong><p style="margin:.5rem 0 0;font-size:.875rem">Open the personal link sent by CGTIA.</p></div>`;
      return;
    }
    try {
      const res = await fetch("/api/validate-licensing-invite?token=" + encodeURIComponent(token));
      const data = await res.json();
      if (!data.valid) {
        mount.innerHTML = `<div style="padding:1.5rem;border:1px solid #fecaca;background:#fef2f2;border-radius:1.25rem"><strong>Link not valid</strong><p style="margin:.5rem 0 0;font-size:.875rem">${data.error || ""}</p></div>`;
        return;
      }
      mount.innerHTML = `
        <h1 style="font-size:1.75rem;font-weight:700;color:#0a1128;margin:0 0 .5rem">Licensing documents</h1>
        <p style="font-size:.875rem;color:#64748b;margin:0 0 1.25rem">One-time form for invited applicants. Paste links to your certificates/documents (e.g. Google Drive). Payment instructions will follow by email if not already arranged.</p>
        <form id="licPktForm" style="display:flex;flex-direction:column;gap:.75rem">
          <input type="hidden" name="token" value="${token}" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Full name *</label>
          <input name="fullName" required value="${(data.fullName || "").replace(/"/g, "&quot;")}" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Email *</label>
          <input name="email" type="email" required value="${(data.email || "").replace(/"/g, "&quot;")}" ${data.email ? "readonly" : ""} style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Phone *</label>
          <input name="phone" required style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">NIN (11 digits)</label>
          <input name="nin" maxlength="11" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Training background *</label>
          <textarea name="trainingBackground" required rows="3" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0"></textarea>
          <label style="font-size:.7rem;font-weight:600;color:#64748b">First-aid / lifesaving cert details</label>
          <input name="firstAidCert" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Clinical hours / experience</label>
          <input name="clinicalHours" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Document links * (Drive / Dropbox URLs, one per line)</label>
          <textarea name="documentLinks" required rows="4" placeholder="https://..." style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0"></textarea>
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Notes</label>
          <textarea name="notes" rows="2" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0"></textarea>
          <button type="submit" style="margin-top:.5rem;padding:.9rem;border:0;border-radius:999px;background:#0a1128;color:#fff;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase">Submit packet</button>
          <p id="licPktErr" style="display:none;color:#b91c1c;font-size:.85rem"></p>
          <p id="licPktOk" style="display:none;color:#065f46;background:#ecfdf5;padding:.75rem;border-radius:1rem;font-size:.85rem">Submitted. Our licensing team will review and contact you about payment and next steps.</p>
        </form>`;
      document.getElementById("licPktForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const payload = Object.fromEntries(fd.entries());
        const err = document.getElementById("licPktErr");
        const ok = document.getElementById("licPktOk");
        err.style.display = "none";
        try {
          const r = await fetch("/api/submit-licensing-packet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || j.error) throw new Error(j.error || "Failed");
          e.target.style.display = "none";
          ok.style.display = "block";
        } catch (ex) {
          err.textContent = ex.message || "Failed";
          err.style.display = "block";
        }
      });
    } catch (e) {
      mount.innerHTML = `<p style="color:#b91c1c">Could not check invite.</p>`;
    }
  })();
}

export const LicensingCompletePage = () => {
  useEffect(() => {
    const t = setTimeout(install, 40);
    return () => clearTimeout(t);
  }, []);
  return html`<${OriginalPage} markup=${licensing_complete_html} />`;
};
