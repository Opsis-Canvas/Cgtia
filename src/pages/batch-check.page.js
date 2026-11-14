/**
 * /batch/check?token=... : walk-in students check their own details.
 * They confirm who they are, see the details the academy asked for, and send changes for review.
 */
import { createElement, useEffect, useState } from "react";
import htm from "htm";

const html = htm.bind(createElement);
const NAVY = "#0f126c";
const BLUE = "#0948e6";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#dfe6f3";
const RED = "#b91c1c";
const LABELS = { surname: "Surname", middleName: "Middle name", lastName: "Last name", email: "Email", phone: "Phone", nin: "NIN", dateOfBirth: "Date of birth", nextOfKinName: "Next of kin name", nextOfKinPhone: "Next of kin phone", nextOfKinPhoneType: "Next of kin phone type", residentialAddress: "Residential address", permanentAddress: "Permanent address", genotype: "Genotype", bloodGroup: "Blood group" };
const TYPES = { email: "email", phone: "tel", nextOfKinPhone: "tel", dateOfBirth: "date" };

async function post(body) {
  const res = await fetch("/api/batch", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

const field = { display: "block", width: "100%", border: "1px solid " + LINE, borderRadius: "16px", padding: "14px", font: "inherit", fontSize: "16px", boxSizing: "border-box", background: "#fff" };
const label = { display: "block", fontSize: "11px", fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase", color: MUTED, margin: "0 0 8px" };
const btn = { width: "100%", height: "54px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 800, fontSize: "16px", cursor: "pointer" };
const errBox = { color: RED, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "11px 13px", margin: 0, fontSize: "14px" };

export function BatchCheckPage() {
  const token = (new URLSearchParams(window.location.search).get("token") || "").trim();
  const [phase, setPhase] = useState("loading"); // loading | invalid | lookup | edit | done
  const [info, setInfo] = useState(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [rules, setRules] = useState({});
  const [values, setValues] = useState({});
  const [edits, setEdits] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    post({ action: "info", token })
      .then(({ data }) => {
        if (!data.valid) { setError(data.error || "This link is not valid."); setPhase("invalid"); return; }
        setInfo(data);
        setPhase("lookup");
      })
      .catch(() => { setError("Could not check this link. Try again later."); setPhase("invalid"); });
  }, []);

  async function lookup(e) {
    e.preventDefault();
    setError("");
    const r = await post({ action: "lookup", token, name, email, mobile });
    if (!r.ok) { setError(r.data.error || "Could not find your record."); return; }
    setRules(r.data.rules || {});
    setValues(r.data.values || {});
    setEdits({ ...(r.data.values || {}) });
    setPhase("edit");
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    const changes = {};
    Object.keys(edits).forEach((k) => { if ((edits[k] || "") !== (values[k] || "")) changes[k] = edits[k] || ""; });
    const r = await post({ action: "submit", token, name, email, mobile, changes });
    if (!r.ok) { setError(r.data.error || "Could not send your changes."); return; }
    setMessage(r.data.message || "Your changes are under review.");
    setPhase("done");
  }

  const shell = (children) => html`<div style=${{ minHeight: "100vh", background: "linear-gradient(180deg,#eef4ff 0%,#f8fafc 65%)", fontFamily: "Inter, system-ui, sans-serif", color: INK }}>
    <div style=${{ maxWidth: "560px", margin: "0 auto", padding: "28px 20px 60px" }}>${children}</div>
  </div>`;

  if (phase === "loading") return shell(html`<p style=${{ color: MUTED }}>Checking your link…</p>`);
  if (phase === "invalid") return shell(html`<h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", color: NAVY }}>This link can't be used</h1><p style=${{ color: MUTED, lineHeight: 1.6 }}>${error}</p>`);
  if (phase === "done") return shell(html`<h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", color: NAVY }}>Received</h1>
    <p style=${{ color: INK, lineHeight: 1.6 }}>${message}</p>
    <p style=${{ color: MUTED, fontSize: "13px" }}>You can close this page now.</p>`);

  if (phase === "lookup") {
    const L = (info && info.lookup) || {};
    return shell(html`<p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".16em", textTransform: "uppercase", color: BLUE, margin: "0 0 10px" }}>${(info && info.label) || "Check your details"}</p>
      <h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "26px", fontWeight: 800, color: NAVY, margin: "0 0 14px" }}>Who are you?</h1>
      <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>Enter the details below so we can find your record.</p>
      <form onSubmit=${lookup} style=${{ display: "grid", gap: "14px" }}>
        ${L.name ? html`<div><label style=${label}>Full name</label><input style=${field} value=${name} onInput=${(e) => setName(e.target.value)} placeholder="Surname, middle and last name" /></div>` : null}
        ${L.email ? html`<div><label style=${label}>Email</label><input type="email" style=${field} value=${email} onInput=${(e) => setEmail(e.target.value)} /></div>` : null}
        ${L.mobile ? html`<div><label style=${label}>Mobile number</label><input type="tel" style=${field} value=${mobile} onInput=${(e) => setMobile(e.target.value)} /></div>` : null}
        ${error ? html`<p style=${errBox}>${error}</p>` : null}
        <button type="submit" style=${btn}>Continue</button>
      </form>`);
  }

  const keys = Object.keys(rules);
  return shell(html`<h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "0 0 10px" }}>Check your details</h1>
    <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 20px" }}>Correct anything that is wrong. Optional fields can be left as they are. Changes go to the academy for review.</p>
    <form onSubmit=${submit} style=${{ display: "grid", gap: "14px" }}>
      ${keys.map((k) => html`<div key=${k}>
        <label style=${label}>${LABELS[k] || k} ${rules[k] === "required" ? html`<span style=${{ color: RED }}>*</span>` : html`<span style=${{ color: MUTED, textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>(optional)</span>`}</label>
        <input type=${TYPES[k] || "text"} style=${field} value=${edits[k] || ""} required=${rules[k] === "required"}
          onInput=${(e) => setEdits({ ...edits, [k]: e.target.value })} />
      </div>`)}
      ${error ? html`<p style=${errBox}>${error}</p>` : null}
      <button type="submit" style=${btn}>Send for review</button>
    </form>`);
}
