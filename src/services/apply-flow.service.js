/**
 * --------------------------------------------------------
 * File:        apply-flow.service.js
 * Purpose:     Apply → email check → Firebase → resume link → payment
 * --------------------------------------------------------
 */

import {
  findApplicationByEmail,
  findApplicationByToken,
  saveApplication,
  markApplicationPaid,
  makeResumeToken,
  getFirebase
} from "./firebase.service.js";

const PENDING_KEY = "cgtia_pending_payment";

function savePending(payload) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({ ...payload, savedAt: Date.now() }));
  } catch (e) {}
}

function getPending() {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data.savedAt && Date.now() - data.savedAt > 14 * 24 * 60 * 60 * 1000) {
      localStorage.removeItem(PENDING_KEY);
      return null;
    }
    if (data.paymentStatus === "paid") return null;
    return data;
  } catch (e) {
    return null;
  }
}

function clearPending() {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch (e) {}
}

function resumeUrl(token) {
  const base = window.location.origin + window.location.pathname.replace(/index\.html$/, "");
  return `${base}?resume=${encodeURIComponent(token)}`;
}

function notifyWhatsApp(app) {
  try {
    const num = String(window.CGTIA_WHATSAPP_NUMBER || "2349164712004").replace(/\D/g, "");
    const text =
      "New CGTIA Application%0A" +
      "Name: " + encodeURIComponent(app.fullName || "") + "%0A" +
      "Phone: " + encodeURIComponent(app.phone || "") + "%0A" +
      "Email: " + encodeURIComponent(app.email || "") + "%0A" +
      "Program: " + encodeURIComponent(app.program || "") + "%0A" +
      "Start: " + encodeURIComponent(app.startDate || "");
    window.open("https://wa.me/" + num + "?text=" + text, "_blank", "noopener");
  } catch (e) {}
}

async function emailResumeLink(app, token) {
  try {
    await fetch("/api/send-applicant-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: app.email,
        fullName: app.fullName,
        program: app.program,
        resumeUrl: resumeUrl(token)
      })
    });
  } catch (e) {
    console.warn("Applicant email failed (check Netlify EMAIL_* env):", e);
  }
}

function openPayment(program, email) {
  if (typeof window.openPaymentScreen === "function") {
    window.openPaymentScreen(program, email);
  }
}

function statusSuccess(title, msg) {
  if (typeof window.setStatusSuccess === "function") window.setStatusSuccess(title, msg);
}

function statusLoading() {
  if (typeof window.setStatusLoading === "function") window.setStatusLoading();
}

function statusError(title, msg) {
  if (typeof window.setStatusError === "function") window.setStatusError(title, msg);
}

function openStatus() {
  if (typeof window.openStatusScreen === "function") window.openStatusScreen();
}

function closeStatus() {
  if (typeof window.closeStatusScreen === "function") window.closeStatusScreen();
}

function closeApply() {
  if (typeof window.closeApplyScreen === "function") window.closeApplyScreen();
  else if (typeof window.toggleApplyScreen === "function") window.toggleApplyScreen();
}

/* Phone rules by country. "maxTyped" is how many digits a person types, including the leading 0 where the
   country uses one (Nigeria: 08136548888 is 11 digits). The leading 0 is dropped when the number is sent in
   international form (+2348136548888). The admin edits these in Apply form > Phone numbers by country. */
const PHONE_RULE_DEFAULTS = {
  NG: { name: "Nigeria", dial: "+234", minTyped: 10, maxTyped: 11, trunkZero: true },
  GH: { name: "Ghana", dial: "+233", minTyped: 9, maxTyped: 10, trunkZero: true },
  KE: { name: "Kenya", dial: "+254", minTyped: 9, maxTyped: 10, trunkZero: true },
  ZA: { name: "South Africa", dial: "+27", minTyped: 9, maxTyped: 10, trunkZero: true },
  GB: { name: "United Kingdom", dial: "+44", minTyped: 10, maxTyped: 11, trunkZero: true },
  US: { name: "United States or Canada", dial: "+1", minTyped: 10, maxTyped: 10, trunkZero: false },
  DEFAULT: { name: "your country", dial: "", minTyped: 6, maxTyped: 15, trunkZero: false }
};
export const PHONE_RULES = PHONE_RULE_DEFAULTS;
let activeRules = { ...PHONE_RULE_DEFAULTS };

export async function loadPhoneRules() {
  try {
    const { db, api } = await getFirebase();
    const snap = await api.getDoc(api.doc(db, "siteContent", "applyForm"));
    const list = snap.exists() && Array.isArray(snap.data().phoneRules) ? snap.data().phoneRules : [];
    if (list.length) {
      const map = { DEFAULT: PHONE_RULE_DEFAULTS.DEFAULT };
      list.forEach((r) => {
        if (r && r.code) {
          map[String(r.code).toUpperCase()] = { name: r.name || r.code, dial: r.dial || "", minTyped: Number(r.minTyped) || 1, maxTyped: Number(r.maxTyped) || 15, trunkZero: !!r.trunkZero };
        }
      });
      activeRules = map;
    }
  } catch (_) { /* keep the built-in rules */ }
  return activeRules;
}

function ruleFor(key) {
  return activeRules[String(key || "NG").toUpperCase()] || activeRules.DEFAULT || PHONE_RULE_DEFAULTS.DEFAULT;
}

/* Turns what the person typed into a number we can store. Returns { ok, e164 } or { ok: false, error }. */
export function normalisePhone(raw, countryKey) {
  const rule = ruleFor(countryKey);
  let digits = String(raw || "").replace(/\D/g, "");
  if (!digits) return { ok: false, error: "Enter your phone number." };
  if (!rule.dial) {
    if (digits.length < rule.minTyped || digits.length > rule.maxTyped) return { ok: false, error: "Enter a valid phone number." };
    return { ok: true, e164: "+" + digits };
  }
  // The person may have typed the country code: 234..., +234...
  const code = rule.dial.replace(/\D/g, "");
  if (digits.startsWith(code) && digits.length > rule.maxTyped) digits = digits.slice(code.length);
  const trunk = rule.trunkZero ? 1 : 0;
  let national = digits;
  if (rule.trunkZero && national.startsWith("0")) national = national.slice(1);
  // Accepts the full number with its leading 0, or the same number without it
  const need = rule.maxTyped - trunk;
  if (national.length !== need) {
    return { ok: false, error: "Enter your " + rule.name + " phone number: " + rule.maxTyped + " digits, or " + (rule.maxTyped - 1) + " without the 0." };
  }
  return { ok: true, e164: rule.dial + national };
}

/* Stops the phone box at the number of digits the chosen country allows. */
function enforcePhoneInput(el) {
  const rule = ruleFor((document.getElementById("phoneCountry") || {}).value || "NG");
  let digits = String(el.value || "").replace(/\D/g, "");
  const code = rule.dial.replace(/\D/g, "");
  if (code && digits.startsWith(code) && digits.length > rule.maxTyped) digits = digits.slice(code.length);
  el.value = digits.slice(0, rule.maxTyped);
}
if (typeof document !== "undefined") {
  document.addEventListener("input", (e) => {
    if (e.target && e.target.id === "phoneInput") enforcePhoneInput(e.target);
  }, true);
  loadPhoneRules();
}

/**
 * Main apply submit — email lookup + save + WhatsApp (no payment; fee links later)
 */
export async function handleApplySubmitFlow(event) {
  if (event && event.preventDefault) event.preventDefault();

  const form = document.getElementById("applyForm");
  const honeypot = document.getElementById("applyWebsiteField");
  if (honeypot && honeypot.value) {
    closeApply();
    return false;
  }

  const programKey = (document.getElementById("programSelect") || {}).value || "";
  if (!programKey) {
    const sel = document.getElementById("programSelect");
    if (sel) sel.reportValidity();
    return false;
  }

  const fullName = ((document.getElementById("fullNameInput") || {}).value || "").trim();
  await loadPhoneRules();
  const phoneRaw = ((document.getElementById("phoneInput") || {}).value || "").trim();
  const phoneCountry = (document.getElementById("phoneCountry") || {}).value || "NG";
  const phoneCheck = normalisePhone(phoneRaw, phoneCountry);
  if (phoneRaw && !phoneCheck.ok) {
    const pi = document.getElementById("phoneInput");
    if (pi) { pi.setCustomValidity(phoneCheck.error); pi.reportValidity(); pi.setCustomValidity(""); }
    return false;
  }
  const phone = phoneCheck.ok ? phoneCheck.e164 : "";
  const email = ((document.getElementById("emailInput") || {}).value || "").trim().toLowerCase();
  if (!fullName || !phone || !email) {
    if (form && form.reportValidity) form.reportValidity();
    return false;
  }

  const startDateEl = document.getElementById("startDateDisplay");
  const startDate = startDateEl ? startDateEl.innerText.trim() : "";
  const messageEl = form ? form.querySelector("textarea") : null;
  const message = messageEl ? messageEl.value.trim() : "";

  const customAnswers = window.__cgtiaCollectCustomAnswers ? window.__cgtiaCollectCustomAnswers() : [];
  if (customAnswers === null) return false;
  window.__cgtiaCustomAnswers = customAnswers;

  Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
    el.disabled = true;
  });

  closeApply();

  setTimeout(async () => {
    openStatus();
    statusLoading();

    try {
      // Warm Firebase
      try {
        await getFirebase();
      } catch (e) {
        console.warn("Firebase unavailable", e);
      }

      // --- Same email recovery ---
      const existing = await findApplicationByEmail(email);
      if (existing) {
        const paid =
          existing.paymentStatus === "paid" ||
          existing.status === "paid" ||
          existing.status === "enrolled" ||
          existing.status === "completed";

        if (paid) {
          statusSuccess(
            "This email is already registered",
            "An application with this email already exists and payment is complete. Please sign in to the student portal, or contact admissions if you need help with another programme."
          );
          const btn = document.getElementById("statusActionBtn");
          if (btn) {
            btn.classList.remove("hidden");
            btn.innerText = "Done";
            btn.onclick = () => closeStatus();
          }
          Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
            el.disabled = false;
          });
          return; // do NOT open WhatsApp for existing applications
        }

        // Unpaid — resume payment only (no WhatsApp re-notify)
        const token = existing.resumeToken || makeResumeToken();
        if (!existing.resumeToken) {
          try {
            await saveApplication({
              ...existing,
              email,
              fullName: existing.fullName || fullName,
              phone: existing.phone || phone,
              program: existing.program || programKey,
              resumeToken: token,
              paymentStatus: "unpaid"
            });
          } catch (e) {}
        }
        savePending({
          email,
          fullName: existing.fullName || fullName,
          phone: existing.phone || phone,
          program: existing.program || programKey,
          resumeToken: token,
          paymentStatus: "unpaid"
        });

        statusSuccess(
          "Application already on file",
          "This email already has an application. Admissions will review it and contact you. No new application was created."
        );
        const btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Done";
          btn.onclick = () => {
            closeStatus();
            /* payment split: no Paystack after apply */;
          };
        }
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
          el.disabled = false;
        });
        return; // do NOT notify WhatsApp again
      }

      // --- New application ---
      const token = makeResumeToken();
      const app = {
        fullName,
        phone,
        email,
        program: programKey,
        startDate,
        message,
        paymentStatus: "unpaid",
        status: "pending",
        resumeToken: token
      };

      try {
        await saveApplication(app);
      } catch (e) {
        console.error("Save application failed", e);
        // Do NOT fire WhatsApp on failed save — application is not on file
        statusError(
          "We could not save your application",
          "We could not save your application online right now. Please try again in a moment. If this keeps happening, contact admissions."
        );
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
          el.disabled = false;
        });
        const btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Try again";
          btn.onclick = () => {
            closeStatus();
            setTimeout(() => {
              if (typeof window.toggleApplyScreen === "function") window.toggleApplyScreen();
            }, 300);
          };
        }
        return;
      }

      savePending(app);
      notifyWhatsApp(app); // only for genuinely new successful saves
      // Fire-and-forget email with unique resume link
      // Payment is no longer on the application form — skip resume payment email

      setTimeout(() => {
        statusSuccess(
          "Application received",
          "Thank you — your application is in. Our team will review it and contact you. Payment comes later via a fee or payment link after acceptance."
        );
        const btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Done";
          btn.onclick = () => {
            closeStatus();
            /* payment split: no Paystack after apply */;
          };
        }
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
          el.disabled = false;
        });
      }, 700);
    } catch (err) {
      console.error(err);
      statusError("Submission Failed", "Something went wrong. Please try again.");
      Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
        el.disabled = false;
      });
    }
  }, 350);

  return false;
}

/** ?resume=TOKEN in URL → open payment for that application */
export async function handleResumeTokenFromUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("resume");
    if (!token) return;

    openStatus();
    statusLoading();

    let app = null;
    try {
      app = await findApplicationByToken(token);
    } catch (e) {}

    // Fallback: pending localStorage with same token
    if (!app) {
      const pending = getPending();
      if (pending && pending.resumeToken === token) app = pending;
    }

    if (!app) {
      statusError("This link is not valid", "This payment link is no longer valid. Please apply again using the same email, or contact admissions for help.");
      const btn = document.getElementById("statusActionBtn");
      if (btn) {
        btn.classList.remove("hidden");
        btn.innerText = "OK";
        btn.onclick = () => closeStatus();
      }
      return;
    }

    if (app.paymentStatus === "paid" || app.status === "paid") {
      clearPending();
      statusSuccess("You have already paid", "This application is already paid. Thank you — you can sign in to the student portal.");
      const btn = document.getElementById("statusActionBtn");
      if (btn) {
        btn.classList.remove("hidden");
        btn.innerText = "Done";
        btn.onclick = () => closeStatus();
      }
      return;
    }

    savePending({
      email: app.email,
      fullName: app.fullName,
      phone: app.phone,
      program: app.program,
      resumeToken: token,
      paymentStatus: "unpaid"
    });

    statusSuccess(
      "Payment has moved",
      "Tuition and other fees are paid with a link from the academy (Fees & payment links), not from the application form. Contact admissions if you need a payment link."
    );
    const btnR = document.getElementById("statusActionBtn");
    if (btnR) {
      btnR.classList.remove("hidden");
      btnR.innerText = "Done";
      btnR.onclick = () => closeStatus();
    }

    // Clean token from URL without reload
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("resume");
      window.history.replaceState({}, "", url.pathname + url.search);
    } catch (e) {}
  } catch (e) {
    console.warn("resume token", e);
  }
}

export async function onPaystackSuccess(email, reference) {
  clearPending();
  try {
    await markApplicationPaid(email, reference);
  } catch (e) {}
}

export function installApplyFlow() {
  window.__cgtiaHandleApplySubmit = function (event) {
    return handleApplySubmitFlow(event);
  };
  window.handleApplySubmit = window.__cgtiaHandleApplySubmit;
  window.__cgtiaOnPaystackSuccess = onPaystackSuccess;
  // Resume from URL after a short delay (DOM ready)
  setTimeout(() => {
    handleResumeTokenFromUrl();
  }, 800);
}
