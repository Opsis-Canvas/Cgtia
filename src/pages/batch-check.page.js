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
const LABELS = { choking: "Choking", sightProblem: "Sight / eye problem", diabetic: "Diabetic", bpProblem: "High / low BP", drugReaction: "Drug reactions", fainting: "Fainting sensation", drugInUse: "Drug in use", asthma: "Asthmatic", allergy: "Allergy", allergyDetail: "What they are allergic to", drugReactionDetail: "Which drug causes a reaction", crisis: "Any crisis / sickness", crisisNote: "Explain the crisis / sickness", surname: "Surname", middleName: "Middle name", lastName: "Last name", email: "Email", phone: "Phone", nin: "NIN", dateOfBirth: "Date of birth", nextOfKinName: "Next of kin name", nextOfKinPhone: "Next of kin phone", nextOfKinPhoneType: "Next of kin phone type", residentialAddress: "Residential address", permanentAddress: "Permanent address", genotype: "Genotype", bloodGroup: "Blood group" };
const TYPES = { email: "email", phone: "tel", nextOfKinPhone: "tel", dateOfBirth: "date" };
const HEALTH_OPTIONS = {
  choking: ["Food", "Liquid", "Tablets or capsules"],
  sightProblem: ["Short-sightedness", "Long-sightedness", "Astigmatism", "Cataract", "Glaucoma", "Colour blindness", "Eye infection", "Night blindness"],
  diabetic: ["Type 1 diabetes", "Type 2 diabetes", "Gestational diabetes", "Pre-diabetes"],
  bpProblem: ["High blood pressure (hypertension)", "Low blood pressure (hypotension)", "Blood pressure that varies"],
  drugReaction: ["Penicillin", "Sulfonamides (sulfa drugs)", "Aspirin", "Ibuprofen or other NSAIDs", "Paracetamol", "Antimalarials", "Local anaesthetic"],
  fainting: ["When standing up quickly", "In heat or crowds", "At the sight of blood or pain", "Unknown cause"],
  drugInUse: ["Metformin", "Insulin", "Amlodipine", "Lisinopril", "Salbutamol inhaler", "Paracetamol", "Artemether-lumefantrine", "Anticonvulsant (for seizures)"],
  asthma: ["Salbutamol (Ventolin) inhaler", "Beclomethasone (Becotide) inhaler", "Salmeterol or formoterol inhaler", "Prednisolone (steroid tablets)"],
  allergy: ["Peanuts", "Tree nuts", "Eggs", "Milk or dairy", "Fish", "Shellfish", "Wheat or gluten", "Soya", "Pollen", "Dust mites", "Latex", "Bee or wasp stings", "Penicillin", "Sulfonamides"],
  crisis: ["Seizure or epilepsy", "Heart condition", "Stroke", "Severe asthma attack", "Very low blood sugar (hypoglycaemia)", "Sickle-cell crisis", "Severe malaria"]
};
const YN = ["Yes", "No"];
const SELECTS = { genotype: ["AA", "AS", "SS", "AC", "SC", "CC", "Unknown"], bloodGroup: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"], choking: YN, sightProblem: YN, diabetic: YN, bpProblem: YN, drugReaction: YN, fainting: YN, drugInUse: YN, asthma: YN, allergy: YN, crisis: YN };

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
  const [stepIdx, setStepIdx] = useState(0);

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
  // Steps: the student works through one group at a time
  const GROUPS = [
    { title: "About you", keys: ["surname", "middleName", "lastName", "dateOfBirth", "nin"] },
    { title: "Contact and address", keys: ["email", "phone", "whatsapp", "residentialAddress", "permanentAddress", "nextOfKinName", "nextOfKinPhone", "nextOfKinPhoneType"] },
    { title: "Health", keys: ["genotype", "bloodGroup", "choking", "sightProblem", "diabetic", "bpProblem", "drugReaction", "fainting", "drugInUse", "asthma", "allergy", "crisis", "crisisNote"] }
  ];
  const steps = GROUPS.map((g) => ({ title: g.title, keys: g.keys.filter((k) => keys.includes(k)) })).filter((g) => g.keys.length);
  const leftover = keys.filter((k) => !steps.some((g) => g.keys.includes(k)));
  if (leftover.length) steps.push({ title: "More", keys: leftover });
  const cur = steps[stepIdx] || steps[0] || { title: "", keys: [] };
  const isLast = stepIdx >= steps.length - 1;
  const backBtn = { height: "54px", padding: "0 22px", borderRadius: "999px", border: "1px solid " + LINE, background: "#fff", color: NAVY, fontWeight: 800, cursor: "pointer" };

  const renderField = (k) => html`<div key=${k}>
    <label style=${label}>${LABELS[k] || k} ${rules[k] === "required" ? html`<span style=${{ color: RED }}>*</span>` : html`<span style=${{ color: MUTED, textTransform: "none", letterSpacing: 0, fontWeight: 600 }}>(optional)</span>`}</label>
    ${SELECTS[k] ? html`<select style=${field} value=${edits[k] || ""} required=${rules[k] === "required"} onChange=${(e) => setEdits({ ...edits, [k]: e.target.value })}>
      <option value="">Choose…</option>${SELECTS[k].map((o) => html`<option key=${o} value=${o}>${o}</option>`)}
    </select>` : k === "crisisNote" ? html`<textarea rows="3" style=${field} value=${edits[k] || ""} onInput=${(e) => setEdits({ ...edits, [k]: e.target.value })}></textarea>`
      : html`<input type=${TYPES[k] || "text"} style=${field} value=${edits[k] || ""} required=${rules[k] === "required"} onInput=${(e) => setEdits({ ...edits, [k]: e.target.value })} />`}
    ${HEALTH_OPTIONS[k] && edits[k] === "Yes" ? html`<div style=${{ marginTop: "8px", display: "grid", gap: "8px" }}>
      <select style=${field} value=${edits[k + "Detail"] || ""} onChange=${(e) => setEdits({ ...edits, [k + "Detail"]: e.target.value })}>
        <option value="">Which one?</option>${HEALTH_OPTIONS[k].map((o) => html`<option key=${o} value=${o}>${o}</option>`)}<option value="Other">Other (type it)</option>
      </select>
      ${edits[k + "Detail"] === "Other" ? html`<input style=${field} placeholder="Type it" value=${edits[k + "Other"] || ""} onInput=${(e) => setEdits({ ...edits, [k + "Other"]: e.target.value })} />` : null}
    </div>` : null}
  </div>`;

  function next(e) {
    e.preventDefault();
    if (!isLast) { setError(""); setStepIdx(stepIdx + 1); return; }
    submit(e);
  }

  return shell(html`<h1 style=${{ fontFamily: "Montserrat, Inter, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "0 0 6px" }}>Check your details</h1>
    <p style=${{ color: MUTED, lineHeight: 1.6, margin: "0 0 18px" }}>Correct anything that is wrong. Optional fields can be left as they are. Changes go to the academy for review.</p>
    <div style=${{ display: "flex", gap: "6px", marginBottom: "18px" }}>
      ${steps.map((g, i) => html`<span key=${g.title} style=${{ flex: 1, height: "6px", borderRadius: "999px", background: i <= stepIdx ? BLUE : LINE }}></span>`)}
    </div>
    <p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase", color: BLUE, margin: "0 0 14px" }}>Step ${stepIdx + 1} of ${steps.length} · ${cur.title}</p>
    <form onSubmit=${next} style=${{ display: "grid", gap: "14px" }}>
      ${cur.keys.map(renderField)}
      ${error ? html`<p style=${errBox}>${error}</p>` : null}
      <div style=${{ display: "flex", gap: "10px" }}>
        ${stepIdx > 0 ? html`<button type="button" style=${backBtn} onClick=${() => { setError(""); setStepIdx(stepIdx - 1); }}>Back</button>` : null}
        <button type="submit" style=${{ ...btn, flex: 1 }}>${isLast ? "Send for review" : "Next"}</button>
      </div>
    </form>`);
}
