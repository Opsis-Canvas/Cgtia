/**
 * Licensing packet — invite-only document upload (after review)
 * URL: /licensing-complete?token=...
 */
import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { licensing_complete_html } from "./content/licensing-complete.content.js";

const html = htm.bind(createElement);

async function uploadFile(path, file) {
  const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const { getStorage, ref, uploadBytes, getDownloadURL } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js");
  const firebaseConfig = {
    apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
    authDomain: "verify-cgtia-cert.firebaseapp.com",
    projectId: "verify-cgtia-cert",
    storageBucket: "verify-cgtia-cert.firebasestorage.app",
    appId: "1:766655761701:web:45f559e0e38023439b5ecc"
  };
  const app = initializeApp(firebaseConfig, "cgtia-lic-packet");
  const storage = getStorage(app);
  const r = ref(storage, path);
  await uploadBytes(r, file);
  return getDownloadURL(r);
}

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
      const preName = (data.fullName || "").replace(/"/g, "&quot;");
      const preEmail = (data.email || "").replace(/"/g, "&quot;");
      mount.innerHTML = `
        <h1 style="font-size:1.75rem;font-weight:700;color:#0a1128;margin:0 0 .5rem">Licensing documents</h1>
        <p style="font-size:.875rem;color:#64748b;margin:0 0 1.25rem">One-time form for invited applicants. Upload your training certificate and a clear selfie. Payment instructions follow by email if not already arranged.</p>
        <form id="licPktForm" style="display:flex;flex-direction:column;gap:.75rem">
          <input type="hidden" name="token" value="${token}" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Full name *</label>
          <input name="fullName" required value="${preName}" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Email *</label>
          <input name="email" type="email" required value="${preEmail}" ${data.email ? "readonly" : ""} style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Phone *</label>
          <input name="phone" type="tel" required style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Training background *</label>
          <textarea name="trainingBackground" required rows="3" placeholder="Where you trained, programme, year completed" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0"></textarea>
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Clinical hours / placement (optional)</label>
          <input name="clinicalHours" placeholder="e.g. 72 hours supervised placement" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Training certificate * (PDF or PNG)</label>
          <input name="certFile" type="file" required accept=".pdf,.png,image/png,application/pdf" style="padding:.5rem 0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Live selfie * (clear photo of your face)</label>
          <input name="selfieFile" type="file" required accept="image/*" capture="user" style="padding:.5rem 0" />
          <label style="font-size:.7rem;font-weight:600;color:#64748b">Notes (optional)</label>
          <textarea name="notes" rows="2" style="padding:.75rem 1rem;border-radius:1rem;border:1px solid #e2e8f0"></textarea>
          <button type="submit" style="margin-top:.5rem;padding:.9rem;border:0;border-radius:999px;background:#0a1128;color:#fff;font-size:.7rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase">Submit packet</button>
          <p id="licPktErr" style="display:none;color:#b91c1c;font-size:.85rem"></p>
          <p id="licPktOk" style="display:none;color:#065f46;background:#ecfdf5;padding:.75rem;border-radius:1rem;font-size:.85rem">Submitted. Our licensing team will review and contact you about payment and next steps.</p>
        </form>`;
      document.getElementById("licPktForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const form = e.target;
        const err = document.getElementById("licPktErr");
        const ok = document.getElementById("licPktOk");
        err.style.display = "none";
        const fd = new FormData(form);
        const certFile = form.querySelector('[name="certFile"]').files[0];
        const selfieFile = form.querySelector('[name="selfieFile"]').files[0];
        if (!certFile || !selfieFile) {
          err.textContent = "Certificate and selfie are required.";
          err.style.display = "block";
          return;
        }
        if (certFile.size > 10 * 1024 * 1024 || selfieFile.size > 8 * 1024 * 1024) {
          err.textContent = "Files are too large (cert max 10MB, selfie max 8MB).";
          err.style.display = "block";
          return;
        }
        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Uploading…"; }
        try {
          const requestId = (crypto.randomUUID && crypto.randomUUID()) || String(Date.now());
          const certExt = (certFile.name.split(".").pop() || "pdf").toLowerCase();
          const selfieExt = (selfieFile.name.split(".").pop() || "jpg").toLowerCase();
          const certificateFileUrl = await uploadFile("licensing-packets/" + requestId + "/certificate." + certExt, certFile);
          const selfieFileUrl = await uploadFile("licensing-packets/" + requestId + "/selfie." + selfieExt, selfieFile);
          if (btn) btn.textContent = "Submitting…";
          const payload = {
            token: String(fd.get("token") || ""),
            fullName: String(fd.get("fullName") || "").trim(),
            email: String(fd.get("email") || "").trim().toLowerCase(),
            phone: String(fd.get("phone") || "").trim(),
            trainingBackground: String(fd.get("trainingBackground") || "").trim(),
            clinicalHours: String(fd.get("clinicalHours") || "").trim(),
            notes: String(fd.get("notes") || "").trim(),
            certificateFileUrl,
            selfieFileUrl
          };
          const r = await fetch("/api/submit-licensing-packet", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok || j.error) throw new Error(j.error || "Failed");
          form.style.display = "none";
          ok.style.display = "block";
        } catch (ex) {
          err.textContent = ex.message || "Failed";
          err.style.display = "block";
          if (btn) { btn.disabled = false; btn.textContent = "Submit packet"; }
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
