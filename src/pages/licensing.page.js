/**
 * LicensingPage — interest / interview request (documents via invite later)
 */
import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { licensing_html } from "./content/licensing.content.js";

const html = htm.bind(createElement);

function installLicensingForm() {
  const form = document.getElementById("licensingForm");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  // Remove duplicate injected request card if an older build left one
  const dup = document.getElementById("cgtiaLicensingRequest");
  if (dup) dup.remove();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const err = document.getElementById("licensingFormErr");
    const ok = document.getElementById("licensingFormOk");
    const btn = document.getElementById("licensingSubmitBtn");
    const honeypot = document.getElementById("licensingWebsiteField");
    if (honeypot && honeypot.value) return;
    if (err) { err.style.display = "none"; err.textContent = ""; }
    if (ok) { ok.style.display = "none"; ok.textContent = ""; }

    const fullName = (document.getElementById("licensingFullName")?.value || "").trim();
    const phone = (document.getElementById("licensingPhone")?.value || "").trim();
    const email = (document.getElementById("licensingEmail")?.value || "").trim().toLowerCase();
    const address = (document.getElementById("licensingAddress")?.value || "").trim();
    const nin = (document.getElementById("licensingNin")?.value || "").replace(/\D/g, "");
    const isSel = document.getElementById("licensingIsStudent")?.value || "";
    const idFile = document.getElementById("idFileInput")?.files?.[0] || null;

    if (!fullName || !phone || !email || !address) {
      if (err) { err.textContent = "Please fill full name, phone, email, and address."; err.style.display = "block"; }
      return;
    }
    if (!idFile && nin.length !== 11) {
      if (err) { err.textContent = "Upload a government ID, or enter a valid 11-digit NIN."; err.style.display = "block"; }
      return;
    }
    if (nin && nin.length !== 11) {
      if (err) { err.textContent = "NIN must be exactly 11 digits."; err.style.display = "block"; }
      return;
    }

    if (btn) { btn.disabled = true; btn.textContent = "Submitting…"; }

    try {
      // Optional: upload ID file via API as data URL is heavy — store metadata only for request stage
      // Full file upload belongs on the invite packet. We still accept ID for verification preference.
      let idFileName = idFile ? idFile.name : "";
      let idFileType = idFile ? idFile.type : "";

      const res = await fetch("/api/submit-licensing-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone,
          address,
          nin: nin || "",
          hasIdUpload: !!idFile,
          idFileName,
          idFileType,
          isCgtiaStudent: isSel === "yes",
          isExternal: isSel === "no"
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        const msg = data.error || "Request failed";
        if (res.status === 409) throw new Error(msg);
        if (res.status === 422) throw new Error(msg);
        throw new Error(msg);
      }

      form.reset();
      const nameEl = document.getElementById("idFileName");
      if (nameEl) nameEl.textContent = "Government ID — PDF or image (optional if NIN below)";
      if (ok) {
        let msg = "Application received. Our team will review and contact you about next steps.";
        if (data.ninKycVerified === true) msg += " Your NIN was verified.";
        if (data.matchedStudent) msg += " We found a matching student record for this email.";
        else if (data.matchedApplication) msg += " We found a prior application with this email.";
        ok.textContent = msg;
        ok.style.display = "block";
      }
    } catch (ex) {
      if (err) { err.textContent = ex.message || "Could not submit"; err.style.display = "block"; }
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = "Submit Licensing Application"; }
    }
  });
}

export const LicensingPage = () => {
  useEffect(() => {
    const t = setTimeout(() => installLicensingForm(), 80);
    return () => clearTimeout(t);
  }, []);
  return html`<${OriginalPage} markup=${licensing_html} />`;
};
