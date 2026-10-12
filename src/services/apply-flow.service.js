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

/**
 * Main apply submit — email lookup + save + WhatsApp + email link + payment
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
  const phone = ((document.getElementById("phoneInput") || {}).value || "").trim();
  const email = ((document.getElementById("emailInput") || {}).value || "").trim().toLowerCase();
  if (!fullName || !phone || !email) {
    if (form && form.reportValidity) form.reportValidity();
    return false;
  }

  const startDateEl = document.getElementById("startDateDisplay");
  const startDate = startDateEl ? startDateEl.innerText.trim() : "";
  const messageEl = form ? form.querySelector("textarea") : null;
  const message = messageEl ? messageEl.value.trim() : "";

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
          existing.status === "enrolled";

        if (paid) {
          statusSuccess(
            "You are already registered",
            "This email already has a completed application with us. Please sign in to the student portal, or contact admissions if you need help with another programme."
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
          return;
        }

        // Unpaid — resume payment
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
          "Welcome back",
          "You already started an application with this email. Please complete payment to secure your seat."
        );
        const btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Continue to Payment";
          btn.onclick = () => {
            closeStatus();
            setTimeout(() => openPayment(existing.program || programKey, email), 400);
          };
        }
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
          el.disabled = false;
        });
        return;
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
        statusError(
          "We could not save your application",
          "We could not save your application online right now. You can still continue to payment on this device, or try again in a moment."
        );
        Array.from(form.querySelectorAll("input, select, textarea, button")).forEach((el) => {
          el.disabled = false;
        });
        // Still allow local pending + payment so user is not stuck
        savePending(app);
        notifyWhatsApp(app);
        const btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Continue to payment";
          btn.onclick = () => {
            closeStatus();
            setTimeout(() => openPayment(programKey, email), 400);
          };
        }
        return;
      }

      savePending(app);
      notifyWhatsApp(app);
      // Fire-and-forget email with unique resume link
      emailResumeLink(app, token);

      setTimeout(() => {
        statusSuccess(
          "Application received",
          "Thanks — complete payment to secure your seat. We also sent you an email with a link to finish payment if you need it later."
        );
        const btn = document.getElementById("statusActionBtn");
        if (btn) {
          btn.classList.remove("hidden");
          btn.innerText = "Continue to Payment";
          btn.onclick = () => {
            closeStatus();
            setTimeout(() => openPayment(programKey, email), 400);
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

    closeStatus();
    setTimeout(() => openPayment(app.program, app.email), 400);

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
