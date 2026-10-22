/**
 * "Pay now" programme cards. The payment step is built from the card itself:
 * the price is the saved programme price, and the server checks it again before recording.
 */
const INPUT_CSS = "padding:.85rem 1rem;border:1px solid #e2e8f0;border-radius:1rem;font-size:14px;outline:none;width:100%;box-sizing:border-box";

function esc(v) {
  return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function openProgramPayment(programId) {
  const settings = window.__cgtiaSiteSettings || {};
  const prog = (settings.programs || {})[programId];
  if (!prog) { alert("This programme is not available right now."); return; }
  const amount = Number(prog.amount) || 0;
  if (prog.priceText || amount <= 0) {
    alert("This programme is not open for online payment yet. Please contact admissions.");
    return;
  }
  const old = document.getElementById("cgtiaProgramPay");
  if (old) old.remove();
  const priceText = "₦" + amount.toLocaleString("en-NG");
  const wrap = document.createElement("div");
  wrap.id = "cgtiaProgramPay";
  wrap.style.cssText = "position:fixed;inset:0;z-index:96;background:rgba(15,23,42,.45);display:flex;align-items:flex-end;justify-content:center;";
  wrap.innerHTML =
    '<div style="width:100%;max-width:28rem;background:#fff;border-radius:1.75rem 1.75rem 0 0;padding:1.25rem 1.35rem 2rem;box-shadow:0 -12px 40px rgba(0,0,0,.2)">' +
    '<div style="width:2.5rem;height:4px;background:#e2e8f0;border-radius:999px;margin:0 auto 1rem"></div>' +
    '<h3 style="font-size:1.15rem;font-weight:800;color:#0f172a;margin:0 0 .25rem">' + esc(prog.name || prog.headline || "Programme") + "</h3>" +
    '<p style="font-size:1.4rem;font-weight:800;color:#1e3a8a;margin:0 0 1rem">' + priceText + "</p>" +
    '<form id="cgtiaProgramPayForm" style="display:grid;gap:.6rem">' +
    '<input name="fullName" required placeholder="Full name" style="' + INPUT_CSS + '" />' +
    '<input name="email" type="email" required placeholder="Email address" style="' + INPUT_CSS + '" />' +
    '<input name="phone" type="tel" required placeholder="Phone number" style="' + INPUT_CSS + '" />' +
    '<p id="cgtiaProgramPayErr" style="color:#b91c1c;font-size:.85rem;margin:0;min-height:1rem"></p>' +
    '<button type="submit" style="width:100%;padding:.95rem;border:0;border-radius:999px;background:#0f172a;color:#fff;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;cursor:pointer">Pay ' + priceText + "</button>" +
    '<button type="button" id="cgtiaProgramPayClose" style="width:100%;padding:.7rem;border:0;background:transparent;color:#64748b;font-size:12px;cursor:pointer">Cancel</button>' +
    "</form></div>";
  document.body.appendChild(wrap);
  wrap.addEventListener("click", function (e) { if (e.target === wrap) wrap.remove(); });
  wrap.querySelector("#cgtiaProgramPayClose").onclick = function () { wrap.remove(); };
  wrap.querySelector("#cgtiaProgramPayForm").onsubmit = function (e) {
    e.preventDefault();
    const f = e.target;
    const err = wrap.querySelector("#cgtiaProgramPayErr");
    const fullName = f.fullName.value.trim();
    const email = f.email.value.trim().toLowerCase();
    const phone = f.phone.value.trim();
    if (!fullName || !email || !phone) { err.textContent = "Please fill in every field."; return; }
    if (typeof window.PaystackPop === "undefined") { err.textContent = "The payment window did not load. Refresh and try again."; return; }
    const reference = "cgtia-prog-" + programId + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 7);
    const handler = window.PaystackPop.setup({
      key: window.CGTIA_PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: Math.round(amount * 100),
      currency: "NGN",
      ref: reference,
      metadata: { custom_fields: [{ display_name: "Programme", variable_name: "programme", value: prog.name || programId }] },
      callback: function (response) {
        confirmProgramPayment(wrap, response.reference, { programId: programId, fullName: fullName, email: email, phone: phone });
      },
      onClose: function () { err.textContent = "Payment was not completed."; }
    });
    handler.openIframe();
  };
}

async function confirmProgramPayment(wrap, reference, info) {
  const err = wrap.querySelector("#cgtiaProgramPayErr");
  if (err) err.textContent = "Confirming your payment…";
  try {
    const res = await fetch("/api/confirm-paystack-client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference: reference, source: "program", programId: info.programId, fullName: info.fullName, email: info.email, phone: info.phone })
    });
    const j = await res.json().catch(function () { return {}; });
    if (res.ok && j.success) {
      const form = wrap.querySelector("#cgtiaProgramPayForm");
      if (form) form.innerHTML =
        '<p style="font-size:1rem;font-weight:700;color:#0f172a;margin:0 0 .5rem">Payment received</p>' +
        '<p style="color:#475569;font-size:.9rem;margin:0 0 1rem">Thank you, ' + esc(info.fullName) + ". Your payment reference is " + esc(reference) + ". Keep it for your records.</p>";
    } else if (err) {
      err.textContent = (j.error || "We could not confirm the payment.") + " Reference: " + reference;
    }
  } catch (e) {
    if (err) err.textContent = "A network problem stopped the confirmation. Contact admissions with reference " + reference + ".";
  }
}

window.openProgramPayment = openProgramPayment;
