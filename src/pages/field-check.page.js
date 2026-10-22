/**
 * FieldCheckPage — invite-gated student legal profile
 * URL: /field-check/confirm?token=XXXX
 */
import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { field_check_html } from "./content/field-check.content.js";

const html = htm.bind(createElement);

function show(el, msg) {
  if (!el) return;
  el.textContent = msg;
  el.classList.remove("hidden");
}
function hide(el) {
  if (!el) return;
  el.classList.add("hidden");
  el.textContent = "";
}

async function validateToken(token) {
  const res = await fetch("/api/validate-student-invite?token=" + encodeURIComponent(token));
  return res.json();
}

function installFieldCheckForm() {
  const params = new URLSearchParams(window.location.search);
  const token = (params.get("token") || "").trim();
  const gate = document.getElementById("fieldCheckGate");
  const main = document.getElementById("fieldCheckMain");
  const gateMsg = document.getElementById("fieldCheckGateMsg");
  const meta = document.getElementById("fieldCheckInviteMeta");
  const tokenInput = document.getElementById("fcToken");
  const emailInput = document.getElementById("fcEmail");
  const nameInput = document.getElementById("fcFullLegalName");

  if (!token) {
    if (gate) gate.classList.remove("hidden");
    if (gateMsg) gateMsg.textContent = "Open the personal link the academy sent you (it includes a secure token). This page cannot be used without that link.";
    return;
  }

  (async () => {
    try {
      const data = await validateToken(token);
      if (!data.valid) {
        if (gate) gate.classList.remove("hidden");
        if (gateMsg) gateMsg.textContent = data.error || "This invite is not valid.";
        return;
      }
      if (main) main.classList.remove("hidden");
      if (tokenInput) tokenInput.value = token;
      if (data.email && emailInput) {
        emailInput.value = data.email;
        emailInput.readOnly = true;
        emailInput.classList.add("bg-slate-100");
      }
      if (data.fullName && nameInput && !nameInput.value) nameInput.value = data.fullName;
      if (meta) {
        const bits = [];
        if (data.program) bits.push("Programme: " + data.program);
        if (data.expiresAt) bits.push("Link expires: " + new Date(data.expiresAt).toLocaleString());
        meta.textContent = bits.join(" · ");
      }
    } catch (e) {
      if (gate) gate.classList.remove("hidden");
      if (gateMsg) gateMsg.textContent = "Could not verify invite. Check your connection and try again.";
      return;
    }
  })();

  const form = document.getElementById("fieldCheckForm");
  if (!form || form.dataset.bound === "1") return;
  form.dataset.bound = "1";

  const errEl = document.getElementById("fieldCheckError");
  const okEl = document.getElementById("fieldCheckSuccess");
  const btn = document.getElementById("fieldCheckSubmit");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hide(errEl);
    hide(okEl);

    const fd = new FormData(form);
    const payload = {
      token: String(fd.get("token") || token || "").trim(),
      fullLegalName: String(fd.get("fullLegalName") || "").trim(),
      nin: String(fd.get("nin") || "").replace(/\D/g, ""),
      dateOfBirth: String(fd.get("dateOfBirth") || "").trim(),
      email: String(fd.get("email") || "").trim().toLowerCase(),
      phone: String(fd.get("phone") || "").trim(),
      nextOfKinName: String(fd.get("nextOfKinName") || "").trim(),
      nextOfKinPhone: String(fd.get("nextOfKinPhone") || "").trim(),
      nextOfKinRelation: String(fd.get("nextOfKinRelation") || "").trim()
    };

    if (!payload.token) {
      show(errEl, "Missing invite token. Use the link from the academy.");
      return;
    }
    if (!payload.fullLegalName || !payload.email || !payload.dateOfBirth) {
      show(errEl, "Please fill in all required fields.");
      return;
    }
    if (payload.nin.length !== 11) {
      show(errEl, "NIN must be exactly 11 digits.");
      return;
    }
    if (!payload.nextOfKinName || !payload.nextOfKinPhone || !payload.nextOfKinRelation) {
      show(errEl, "Please complete next-of-kin details.");
      return;
    }

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting…";
    }

    try {
      const res = await fetch("/api/submit-student-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        throw new Error(data.error || "Submission failed. Please try again.");
      }
      form.reset();
      const reg = data.regNumber ? ` Your registration number is ${data.regNumber}.` : "";
      show(okEl, "Thank you. Your profile has been saved." + reg + " Keep this number for your records.");
      if (btn) btn.disabled = true;
    } catch (err) {
      show(errEl, err.message || "Could not submit. Check your connection and try again.");
    } finally {
      if (btn && !okEl || (okEl && okEl.classList.contains("hidden"))) {
        btn.disabled = false;
        btn.textContent = "Submit profile";
      }
    }
  });
}

export const FieldCheckPage = () => {
  useEffect(() => {
    const t = setTimeout(() => installFieldCheckForm(), 40);
    return () => clearTimeout(t);
  }, []);
  return html`<${OriginalPage} markup=${field_check_html} />`;
};
