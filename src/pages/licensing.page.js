/**
 * LicensingPage — request form + original visuals
 */
import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { licensing_html } from "./content/licensing.content.js";

const html = htm.bind(createElement);

const REQUEST_UI = `
<style>
  .cgtia-lic-box{max-width:36rem;margin:0 auto 3rem;padding:0 1.5rem}
  .cgtia-lic-card{border-radius:1.75rem;border:1px solid #e2e8f0;background:#fff;padding:1.75rem;box-shadow:0 10px 40px rgba(15,23,42,.06)}
  .cgtia-lic-card h2{font-size:1.35rem;font-weight:700;color:#0a1128;margin:0 0 .5rem}
  .cgtia-lic-card p.lead{font-size:.875rem;color:#64748b;margin:0 0 1.25rem;line-height:1.5}
  .cgtia-lic-card label{display:block;font-size:.7rem;font-weight:600;color:#64748b;margin:0 0 .35rem}
  .cgtia-lic-card input,.cgtia-lic-card select,.cgtia-lic-card textarea{
    width:100%;padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0;background:#f8fafc;font-size:.875rem;margin-bottom:.85rem
  }
  .cgtia-lic-card button{width:100%;padding:.9rem;border:0;border-radius:999px;background:#0a1128;color:#fff;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .cgtia-lic-card button:disabled{opacity:.6}
  .cgtia-lic-ok{display:none;margin-top:.75rem;padding:.75rem 1rem;border-radius:1rem;background:#ecfdf5;border:1px solid #a7f3d0;color:#065f46;font-size:.85rem}
  .cgtia-lic-err{display:none;margin-top:.75rem;color:#b91c1c;font-size:.85rem}
</style>
<div class="cgtia-lic-box" id="cgtiaLicensingRequest">
  <div class="cgtia-lic-card">
    <h2>Request licensing review</h2>
    <p class="lead">Tell us who you are. CGTIA students and external applicants use the same form — we handle the next steps differently. After review we may schedule a conversation; qualified external applicants receive a one-time secure link to upload documents and complete payment.</p>
    <form id="licReqForm">
      <label>Full name *</label>
      <input name="fullName" required placeholder="As on your documents" />
      <label>Email *</label>
      <input name="email" type="email" required />
      <label>Phone *</label>
      <input name="phone" type="tel" required />
      <label>Are you a current / former CGTIA student? *</label>
      <select name="isCgtiaStudent" id="licIsStudent" required>
        <option value="">Select…</option>
        <option value="yes">Yes — CGTIA student / graduate</option>
        <option value="no">No — external applicant</option>
      </select>
      <div id="licRegWrap" style="display:none">
        <label>Registration number (if you have one)</label>
        <input name="regNumber" placeholder="CGTIA/2026/A/…" />
      </div>
      <label>Training background *</label>
      <textarea name="trainingBackground" rows="3" required placeholder="Certificate / school / clinical hours"></textarea>
      <label>Anything else we should know</label>
      <textarea name="message" rows="2" placeholder="Optional"></textarea>
      <button type="submit" id="licReqBtn">Submit request</button>
      <p class="cgtia-lic-err" id="licReqErr"></p>
      <p class="cgtia-lic-ok" id="licReqOk">Thank you. Your licensing request was received. Our team will contact you by email.</p>
    </form>
  </div>
</div>
`;

function installLicensingRequest() {
  // Insert after first major section if mount missing
  let mount = document.getElementById("cgtiaLicensingRequest");
  if (!mount) {
    const hero = document.querySelector("section");
    const wrap = document.createElement("div");
    wrap.innerHTML = REQUEST_UI;
    const node = wrap.firstElementChild;
    if (hero && hero.parentNode) {
      hero.parentNode.insertBefore(node, hero.nextSibling);
    } else {
      document.getElementById("root")?.appendChild(node);
    }
    mount = document.getElementById("cgtiaLicensingRequest");
  }
  const form = document.getElementById("licReqForm");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  const isSel = document.getElementById("licIsStudent");
  const regWrap = document.getElementById("licRegWrap");
  isSel?.addEventListener("change", () => {
    regWrap.style.display = isSel.value === "yes" ? "block" : "none";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("licReqErr");
    const ok = document.getElementById("licReqOk");
    const btn = document.getElementById("licReqBtn");
    err.style.display = "none";
    ok.style.display = "none";
    const fd = new FormData(form);
    const payload = {
      fullName: String(fd.get("fullName") || "").trim(),
      email: String(fd.get("email") || "").trim().toLowerCase(),
      phone: String(fd.get("phone") || "").trim(),
      isCgtiaStudent: fd.get("isCgtiaStudent") === "yes",
      regNumber: String(fd.get("regNumber") || "").trim(),
      trainingBackground: String(fd.get("trainingBackground") || "").trim(),
      message: String(fd.get("message") || "").trim()
    };
    btn.disabled = true;
    btn.textContent = "Sending…";
    try {
      const res = await fetch("/api/submit-licensing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Request failed");
      form.reset();
      regWrap.style.display = "none";
      ok.style.display = "block";
    } catch (ex) {
      err.textContent = ex.message || "Could not send request";
      err.style.display = "block";
    } finally {
      btn.disabled = false;
      btn.textContent = "Submit request";
    }
  });
}

export const LicensingPage = () => {
  useEffect(() => {
    const t = setTimeout(() => installLicensingRequest(), 80);
    return () => clearTimeout(t);
  }, []);
  return html`<${OriginalPage} markup=${licensing_html} />`;
};
