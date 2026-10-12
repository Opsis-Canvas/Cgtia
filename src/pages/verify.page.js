/**
 * VerifyPage — Certificate | ID card | Licence | Student
 */
import { createElement, useEffect } from "react";
import htm from "htm";
import { OriginalPage } from "../components/layout/original-page.component.js";
import { verify_html } from "./content/verify.content.js";

const html = htm.bind(createElement);

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
  authDomain: "verify-cgtia-cert.firebaseapp.com",
  projectId: "verify-cgtia-cert",
  storageBucket: "verify-cgtia-cert.firebasestorage.app",
  messagingSenderId: "766655761701",
  appId: "1:766655761701:web:d59853909358bf3b9b5ecc"
};

const IMAGE_BASE = "https://cgtia-assets.netlify.app";

function assetUrl(path) {
  if (!path) return "";
  const p = String(path).trim();
  if (/^https?:\/\//i.test(p)) return p;
  return IMAGE_BASE.replace(/\/$/, "") + "/" + p.replace(/^\//, "");
}

async function getDb() {
  const { initializeApp, getApps, getApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
  const { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } =
    await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
  const app = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);
  const db = getFirestore(app);
  return { db, doc, getDoc, collection, query, where, getDocs, limit };
}

async function lookupById(col, id) {
  const api = await getDb();
  const snap = await api.getDoc(api.doc(api.db, col, id));
  if (snap.exists()) return { id: snap.id, ...snap.data() };
  return null;
}

async function lookupByField(col, field, value) {
  const api = await getDb();
  const q = api.query(api.collection(api.db, col), api.where(field, "==", value), api.limit(1));
  const snap = await api.getDocs(q);
  if (!snap.empty) {
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  }
  return null;
}

function statusClass(st) {
  const s = String(st || "").toLowerCase();
  if (s === "valid" || s === "active" || s === "issued") return "ok";
  if (s === "expired") return "warn";
  if (s === "revoked" || s === "suspended" || s === "banned") return "bad";
  return "warn";
}

function renderCard(el, kind, data, queryVal) {
  el.classList.remove("hidden");
  if (!data) {
    el.innerHTML = `<div class="cgtia-v-box cgtia-v-bad"><p class="cgtia-v-label">Not found</p><p>No ${kind} matched <code>${escapeHtml(queryVal)}</code>.</p></div>`;
    return;
  }
  const st = String(data.status || "valid").toLowerCase();
  const sc = statusClass(st);
  const photo = assetUrl(data.photoUrl || data.photo || "");
  let body = "";

  if (kind === "certificate") {
    body = `
      <dl class="cgtia-v-dl">
        <div><dt>Certificate code</dt><dd class="mono">${escapeHtml(data.code || data.id)}</dd></div>
        <div><dt>Status</dt><dd class="cap">${escapeHtml(st)}</dd></div>
        <div><dt>Holder</dt><dd><strong>${escapeHtml(data.studentName || "—")}</strong></dd></div>
        <div><dt>Programme</dt><dd class="cap">${escapeHtml(data.program || "—")}</dd></div>
        <div><dt>Reg number</dt><dd class="mono">${escapeHtml(data.regNumber || "—")}</dd></div>
        <div><dt>Issued</dt><dd>${escapeHtml(data.issueDate || "—")}</dd></div>
        ${data.grade ? `<div><dt>Result</dt><dd>${escapeHtml(data.grade)}</dd></div>` : ""}
      </dl>
      <p class="cgtia-v-seal">Verified against CGTIA certificate records</p>`;
  } else if (kind === "id-card") {
    body = `
      <dl class="cgtia-v-dl">
        <div><dt>ID card code</dt><dd class="mono">${escapeHtml(data.code || data.id)}</dd></div>
        <div><dt>Status</dt><dd class="cap">${escapeHtml(st)}</dd></div>
        <div><dt>Student</dt><dd><strong>${escapeHtml(data.studentName || "—")}</strong></dd></div>
        <div><dt>Reg number</dt><dd class="mono">${escapeHtml(data.regNumber || "—")}</dd></div>
        <div><dt>Programme</dt><dd class="cap">${escapeHtml(data.program || "—")}</dd></div>
        <div><dt>Cohort</dt><dd>${escapeHtml(data.cohort || "—")}</dd></div>
        <div><dt>Valid from</dt><dd>${escapeHtml(data.issueDate || "—")}</dd></div>
        <div><dt>Expires</dt><dd>${escapeHtml(data.expiryDate || "—")}</dd></div>
      </dl>
      <p class="cgtia-v-seal">Student ID — not renewable after programme end (unless policy changes)</p>`;
  } else if (kind === "licence") {
    body = `
      <dl class="cgtia-v-dl">
        <div><dt>Licence number</dt><dd class="mono">${escapeHtml(data.code || data.id)}</dd></div>
        <div><dt>Status</dt><dd class="cap">${escapeHtml(st)}</dd></div>
        <div><dt>Holder</dt><dd><strong>${escapeHtml(data.holderName || data.studentName || "—")}</strong></dd></div>
        <div><dt>Category</dt><dd>${escapeHtml(data.category || data.program || "—")}</dd></div>
        <div><dt>Issued</dt><dd>${escapeHtml(data.issueDate || "—")}</dd></div>
        <div><dt>Expires</dt><dd>${escapeHtml(data.expiryDate || "—")}</dd></div>
        ${data.renewedAt ? `<div><dt>Last renewed</dt><dd>${escapeHtml(data.renewedAt)}</dd></div>` : ""}
      </dl>
      <p class="cgtia-v-seal">Professional licence record — may be suspended, revoked, renewed, or banned</p>`;
  } else if (kind === "student") {
    body = `
      <dl class="cgtia-v-dl">
        <div><dt>Reg number</dt><dd class="mono">${escapeHtml(data.regNumber || data.id)}</dd></div>
        <div><dt>Status</dt><dd class="cap">${escapeHtml(data.status || "active")}</dd></div>
        <div><dt>Name</dt><dd><strong>${escapeHtml(data.fullLegalName || data.fullName || "—")}</strong></dd></div>
        <div><dt>Programme</dt><dd class="cap">${escapeHtml(data.program || "—")}</dd></div>
        <div><dt>Cohort</dt><dd>${escapeHtml(data.cohort || "—")}</dd></div>
        ${data.certificateCode ? `<div><dt>Certificate</dt><dd class="mono">${escapeHtml(data.certificateCode)}</dd></div>` : ""}
      </dl>
      <p class="cgtia-v-seal">Enrolled student record</p>`;
  }

  const photoHtml = photo
    ? `<div class="cgtia-v-photo"><img src="${escapeHtml(photo)}" alt="" onerror="this.parentElement.style.display='none'"/></div>`
    : "";

  el.innerHTML = `
    <div class="cgtia-v-box cgtia-v-${sc}">
      <p class="cgtia-v-label">${kindLabel(kind)} verification</p>
      <div class="cgtia-v-row">${photoHtml}<div class="cgtia-v-main">${body}</div></div>
    </div>`;
}

function kindLabel(k) {
  return ({ certificate: "Certificate", "id-card": "ID card", licence: "Licence", student: "Student" })[k] || k;
}

function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const VERIFY_UI = `
<style>
  .cgtia-v-wrap{max-width:40rem;margin:0 auto;padding:2rem 1.5rem 4rem}
  .cgtia-v-tabs{display:flex;flex-wrap:wrap;gap:.4rem;margin:1.25rem 0 1.5rem}
  .cgtia-v-tab{border:1px solid #e2e8f0;background:#fff;border-radius:999px;padding:.45rem 1rem;font-size:.7rem;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:#64748b;cursor:pointer}
  .cgtia-v-tab.on{background:#0a1128;color:#fff;border-color:#0a1128}
  .cgtia-v-box{border-radius:1.5rem;padding:1.5rem;border:1px solid #e2e8f0;background:#f8fafc}
  .cgtia-v-ok{border-color:#a7f3d0;background:#ecfdf5}
  .cgtia-v-warn{border-color:#fde68a;background:#fffbeb}
  .cgtia-v-bad{border-color:#fecaca;background:#fef2f2}
  .cgtia-v-label{font-size:.65rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin:0 0 .75rem;color:#334155}
  .cgtia-v-dl{display:grid;grid-template-columns:1fr 1fr;gap:.75rem;font-size:.875rem}
  .cgtia-v-dl dt{font-size:.65rem;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin:0}
  .cgtia-v-dl dd{margin:.15rem 0 0;color:#0f172a}
  .cgtia-v-dl .mono{font-family:ui-monospace,monospace;font-size:.8rem}
  .cgtia-v-dl .cap{text-transform:capitalize}
  .cgtia-v-seal{margin:1rem 0 0;font-size:.7rem;color:#64748b;border-top:1px dashed #cbd5e1;padding-top:.75rem}
  .cgtia-v-row{display:flex;gap:1rem;flex-wrap:wrap}
  .cgtia-v-photo{width:96px;height:96px;border-radius:1rem;overflow:hidden;background:#e2e8f0;flex-shrink:0}
  .cgtia-v-photo img{width:100%;height:100%;object-fit:cover}
  .cgtia-v-main{flex:1;min-width:12rem}
  .cgtia-v-input{width:100%;padding:.85rem 1rem;border-radius:1rem;border:1px solid #e2e8f0;background:#f8fafc;font-size:.875rem;margin-bottom:1rem}
  .cgtia-v-btn{width:100%;padding:.9rem;border-radius:999px;border:0;background:#0a1128;color:#fff;font-size:.7rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;cursor:pointer}
  .cgtia-v-btn:disabled{opacity:.6}
  .cgtia-v-hint{font-size:.75rem;color:#94a3b8;margin:.35rem 0 1rem}
</style>
<div class="cgtia-v-wrap">
  <p style="font-size:.7rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:#1e3a5f;margin:0 0 .5rem">Verification</p>
  <h1 style="font-size:1.75rem;font-weight:700;color:#0a1128;margin:0 0 .5rem">Verify a record</h1>
  <p style="font-size:.875rem;color:#64748b;margin:0">Choose what to verify, then enter the code or registration number.</p>
  <div class="cgtia-v-tabs" id="verifyTabs">
    <button type="button" class="cgtia-v-tab on" data-kind="certificate">Certificate</button>
    <button type="button" class="cgtia-v-tab" data-kind="id-card">ID card</button>
    <button type="button" class="cgtia-v-tab" data-kind="licence">Licence</button>
    <button type="button" class="cgtia-v-tab" data-kind="student">Student</button>
  </div>
  <form id="verifyForm">
    <label id="verifyLabel" style="font-size:.7rem;font-weight:600;color:#64748b;display:block;margin-bottom:.35rem">Certificate code</label>
    <input class="cgtia-v-input" id="verifyInput" autocomplete="off" placeholder="Paste code here" required />
    <p class="cgtia-v-hint" id="verifyHint">Issued certificate codes look like CGTIA-20261010-…</p>
    <button type="submit" class="cgtia-v-btn" id="verifyBtn">Verify</button>
  </form>
  <div id="verifyResult" class="hidden" style="margin-top:1.5rem"></div>
</div>
`;

function installVerify() {
  const root = document.getElementById("cgtiaVerifyMount");
  if (!root || root.dataset.bound === "1") return;
  root.dataset.bound = "1";
  root.innerHTML = VERIFY_UI;

  let kind = "certificate";
  const input = document.getElementById("verifyInput");
  const label = document.getElementById("verifyLabel");
  const hint = document.getElementById("verifyHint");
  const result = document.getElementById("verifyResult");
  const form = document.getElementById("verifyForm");
  const btn = document.getElementById("verifyBtn");

  const hints = {
    certificate: ["Certificate code", "Issued certificate codes (from academy records)."],
    "id-card": ["ID card code", "Student ID codes issued during the programme (expire when classes end)."],
    licence: ["Licence number", "Professional licence number on the licence document."],
    student: ["Registration number", "Student reg number, e.g. CGTIA/2026/A/…"]
  };

  document.getElementById("verifyTabs").addEventListener("click", (e) => {
    const b = e.target.closest("[data-kind]");
    if (!b) return;
    kind = b.getAttribute("data-kind");
    document.querySelectorAll(".cgtia-v-tab").forEach((t) => t.classList.toggle("on", t === b));
    label.textContent = hints[kind][0];
    hint.textContent = hints[kind][1];
    input.placeholder = hints[kind][0];
    result.classList.add("hidden");
    result.innerHTML = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = (input.value || "").trim();
    if (!q) return;
    btn.disabled = true;
    btn.textContent = "Checking…";
    result.classList.remove("hidden");
    result.innerHTML = `<p style="font-size:.875rem;color:#64748b">Looking up…</p>`;
    try {
      let data = null;
      if (kind === "certificate") {
        data = await lookupById("certificates", q.toUpperCase()) || await lookupByField("certificates", "code", q.toUpperCase());
      } else if (kind === "id-card") {
        data = await lookupById("idCards", q.toUpperCase()) || await lookupByField("idCards", "code", q.toUpperCase());
        if (data && data.expiryDate && new Date(data.expiryDate) < new Date() && String(data.status).toLowerCase() === "valid") {
          data = { ...data, status: "expired" };
        }
      } else if (kind === "licence") {
        data = await lookupById("licences", q.toUpperCase()) || await lookupByField("licences", "code", q.toUpperCase());
      } else if (kind === "student") {
        data = await lookupByField("students", "regNumber", q) || await lookupById("students", q);
      }
      renderCard(result, kind, data, q);
    } catch (err) {
      result.innerHTML = `<div class="cgtia-v-box cgtia-v-bad"><p>Could not reach verification service.</p><p style="font-size:.75rem">${escapeHtml(err.message || "")}</p></div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = "Verify";
    }
  });
}

export const VerifyPage = () => {
  useEffect(() => {
    const t = setTimeout(() => installVerify(), 50);
    return () => clearTimeout(t);
  }, []);
  return html`<${OriginalPage} markup=${verify_html} />`;
};
