/**
 * ApplyFormPage: a form built in the admin's Forms tab, in the site's look.
 *   /apply-form/confirm?token=...  a link sent to one person or a few
 *   /apply-form?form=ID            an open form, only while it is placed on a page
 * Steps: questions are grouped by step. One step shows at a time, with Back and Next.
 * The page only shows and sends. The server checks the link or form and saves the answers.
 */
import { createElement, useEffect, useState } from "react";
import htm from "htm";

const html = htm.bind(createElement);

const NAVY = "#0f126c";
const DRAFT_KEY = "cgtia-draft-";

function readLocalDraft(formId) {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY + formId) || "null"); } catch (e) { return null; }
}
function writeLocalDraft(formId, answers) {
  try { localStorage.setItem(DRAFT_KEY + formId, JSON.stringify(answers)); } catch (e) {}
}
// Puts saved answers back into the fields, matched by question label
function fillFromDraft(prev, fields, saved) { return fillFromDraftFields(prev, fields, saved); }
const BLUE = "#0948e6";
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#dfe6f3";

async function loadForm() {
  const params = new URLSearchParams(window.location.search);
  const token = (params.get("token") || "").trim();
  const formId = (params.get("form") || "").trim();
  if (token) {
    const res = await fetch("/api/validate-form-link?token=" + encodeURIComponent(token));
    const data = await res.json().catch(() => ({ valid: false, error: "Could not check this link." }));
    return data.valid ? { ...data, mode: "link", token } : { error: data.error || "This link is not valid." };
  }
  if (formId) {
    const res = await fetch("/api/get-open-form?form=" + encodeURIComponent(formId));
    const data = await res.json().catch(() => ({ valid: false }));
    return data.valid ? { ...data, mode: "open", formId } : { error: data.error || "This form is not available." };
  }
  return { error: "Open the link the academy sent you, or use the form button on the page you were on." };
}

function defaultsFor(fields, email, defaultCode) {
  const out = {};
  (fields || []).forEach((f, i) => {
    if (f.type === "checkbox") out[i] = [];
    else if (f.type === "email" && email) out[i] = email;
    else out[i] = "";
    if (f.type === "phone") out["c" + i] = defaultCode || "NG";
  });
  return out;
}

// The value stored for one question: a phone is "CODE digits", a tick box is a list joined with commas
function answerValue(f, i, values) {
  if (f.type === "checkbox") return Array.isArray(values[i]) ? values[i].join(", ") : "";
  if (f.type === "phone") {
    const d = String(values[i] == null ? "" : values[i]).trim();
    return d ? (String(values["c" + i] || "NG") + " " + d) : "";
  }
  return String(values[i] == null ? "" : values[i]).trim();
}

// Saved answers back into the fields, matched by question label (phones split back into code and digits)
function fillFromDraftFields(prev, fields, saved) {
  const next = { ...prev };
  (fields || []).forEach((f, i) => {
    const hit = (saved || []).find((a) => a && a.label === f.label);
    if (!hit) return;
    if (f.type === "checkbox") next[i] = String(hit.value || "").split(", ").filter(Boolean);
    else if (f.type === "phone") {
      const v = String(hit.value || "");
      const sp = v.indexOf(" ");
      if (sp > 0) { next["c" + i] = v.slice(0, sp); next[i] = v.slice(sp + 1); }
      else next[i] = v;
    } else next[i] = hit.value;
  });
  return next;
}

const inputStyle = { width: "100%", border: "1px solid " + LINE, borderRadius: "16px", padding: "13px 15px", font: "inherit", fontSize: "15px", color: INK, background: "#f8fafc", boxSizing: "border-box" };
const labelStyle = { display: "block", fontSize: "12px", fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: MUTED, margin: "0 0 7px" };
const pill = (on) => ({ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid " + (on ? BLUE : LINE), background: on ? "#eef4ff" : "#f8fafc", color: INK, borderRadius: "999px", padding: "10px 16px", fontSize: "14px", fontWeight: 600, cursor: "pointer" });

function FieldInput({ f, i, value, setValue, locked, rules, code, setCode }) {
  if (f.type === "phone") {
    const list = rules && rules.length ? rules : [{ code: "NG", name: "Nigeria", dial: "+234" }];
    return html`<div style=${{ display: "flex", gap: "8px", alignItems: "stretch" }}>
      <select style=${Object.assign({}, inputStyle, { width: "46%", flex: "0 0 46%" })} value=${code || list[0].code} onChange=${(e) => setCode(e.target.value)}>
        ${list.map((r) => html`<option key=${r.code} value=${r.code}>${r.dial} ${r.name}</option>`)}
      </select>
      <input type="tel" style=${Object.assign({}, inputStyle, { flex: "1 1 auto", minWidth: 0 })} value=${value || ""} placeholder="Phone number" onInput=${(e) => setValue(i, e.target.value)} />
    </div>`;
  }
  if (f.type === "long") return html`<textarea rows="4" style=${inputStyle} value=${value || ""} onInput=${(e) => setValue(i, e.target.value)}></textarea>`;
  if (f.type === "select") {
    return html`<select style=${inputStyle} value=${value || ""} onChange=${(e) => setValue(i, e.target.value)}>
      <option value="">Select one</option>
      ${(f.options || []).map((o) => html`<option key=${o} value=${o}>${o}</option>`)}
    </select>`;
  }
  if (f.type === "choice") {
    return html`<div style=${{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      ${(f.options || []).map((o) => html`<label key=${o} style=${pill(value === o)}>
        <input type="radio" name=${"q" + i} value=${o} checked=${value === o} onChange=${() => setValue(i, o)} style=${{ accentColor: BLUE }} /> ${o}
      </label>`)}
    </div>`;
  }
  if (f.type === "checkbox") {
    const list = Array.isArray(value) ? value : [];
    return html`<div style=${{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
      ${(f.options || []).map((o) => html`<label key=${o} style=${pill(list.includes(o))}>
        <input type="checkbox" checked=${list.includes(o)} style=${{ accentColor: BLUE }} onChange=${(e) => setValue(i, e.target.checked ? list.concat([o]) : list.filter((x) => x !== o))} /> ${o}
      </label>`)}
    </div>`;
  }
  const type = { email: "email", date: "date", phone: "tel" }[f.type] || "text";
  return html`<input type=${type} style=${Object.assign({}, inputStyle, locked ? { background: "#eef2fb" } : {})} value=${value || ""} readOnly=${!!locked} onInput=${(e) => setValue(i, e.target.value)} />`;
}

export function ApplyFormPage() {
  const [state, setState] = useState({ loading: true });
  const [values, setValues] = useState({});
  const [step, setStep] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let alive = true;
    loadForm().then((s) => {
      if (!alive) return;
      setState({ loading: false, ...s });
      setValues(defaultsFor(s.fields, s.email, (s.phoneRules && s.phoneRules[0] && s.phoneRules[0].code) || "NG"));
      if (s.mode === "link") {
        fetch("/api/form-draft?token=" + encodeURIComponent(s.token))
          .then((r) => r.json())
          .then((d) => { if (alive && d.answers && d.answers.length) setValues((prev) => fillFromDraft(prev, s.fields, d.answers)); })
          .catch(() => {});
      } else {
        const local = readLocalDraft(s.formId);
        if (alive && local) setValues((prev) => fillFromDraft(prev, s.fields, local));
      }
    }).catch(() => {
      if (alive) setState({ loading: false, error: "Could not load this form. Try again later." });
    });
    return () => { alive = false; };
  }, []);

  const setValue = (i, v) => setValues((prev) => ({ ...prev, [i]: v }));
  const [draftNote, setDraftNote] = useState("");

  async function saveDraft() {
    setErr("");
    setDraftNote("");
    const answers = (state.fields || []).map((f, i) => ({ label: f.label, value: answerValue(f, i, values) }));
    try {
      if (state.mode === "link") {
        const res = await fetch("/api/form-draft", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: state.token, answers }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.error) throw new Error(data.error || "Could not save the draft.");
      } else {
        writeLocalDraft(state.formId, answers);
      }
      setDraftNote("Draft saved. You can come back to this link and carry on.");
    } catch (ex) {
      setErr(ex.message || "Could not save the draft.");
    }
  }
  const stages = state.stages && state.stages.length ? state.stages : [{ title: "" }];
  const fields = state.fields || [];
  // A question whose step number is past the last step is shown in the last step, so nothing is skipped
  const stageIndexes = (n) => fields.map((f, i) => (Math.min(stages.length, f.stage || 1) === n + 1 ? i : -1)).filter((i) => i >= 0);


  function next() {
    setErr("");
    for (const i of stageIndexes(step)) {
      const v = answerValue(fields[i], i, values);
      if (fields[i].required && !v) { setErr("Please answer: " + fields[i].label); return; }
    }
    setStep(Math.min(stages.length - 1, step + 1));
  }

  async function submit(e) {
    e.preventDefault();
    setErr("");
    for (let n = 0; n < stages.length; n++) {
      for (const i of stageIndexes(n)) {
        const v = answerValue(fields[i], i, values);
        if (fields[i].required && !v) { setStep(n); setErr("Please answer: " + fields[i].label); return; }
      }
    }
    const answers = fields.map((f, i) => ({ label: f.label, type: f.type, value: answerValue(f, i, values) }));
    setBusy(true);
    try {
      const body = state.mode === "link" ? { token: state.token, answers } : { formId: state.formId, answers };
      const res = await fetch("/api/submit-form", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) throw new Error(data.error || "Could not send. Try again.");
      setDone(true);
    } catch (ex) {
      setErr(ex.message || "Could not send. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const shell = { minHeight: "100vh", background: "linear-gradient(180deg,#eef4ff 0%,#f8fafc 60%)", padding: "24px 16px 64px", fontFamily: "Inter, system-ui, sans-serif", color: INK };
  const card = { maxWidth: "min(760px, 100%)", margin: "0 auto", background: "#fff", border: "1px solid " + LINE, borderRadius: "28px", padding: "28px", boxShadow: "0 24px 48px -30px rgba(15,18,108,.45)" };
  const head = { fontFamily: "Montserrat, Inter, system-ui, sans-serif", fontSize: "24px", fontWeight: 800, color: NAVY, margin: "0 0 6px", lineHeight: 1.2 };
  const brand = { display: "flex", alignItems: "center", justifyContent: "space-between", maxWidth: "640px", margin: "0 auto 14px", fontFamily: "Montserrat, Inter, system-ui, sans-serif" };

  if (state.loading) return html`<div style=${shell}><div style=${card}><p style=${{ color: MUTED }}>Loading…</p></div></div>`;
  if (state.error) return html`<div style=${shell}><div style=${brand}><strong style=${{ color: NAVY, fontSize: "15px" }}>CGTIA</strong></div><div style=${card}><h1 style=${head}>This form can't be opened</h1><p style=${{ color: MUTED }}>${state.error}</p></div></div>`;
  if (done) return html`<div style=${shell}><div style=${brand}><strong style=${{ color: NAVY, fontSize: "15px" }}>CGTIA</strong></div><div style=${card}><h1 style=${head}>Thank you</h1><p style=${{ color: MUTED, lineHeight: 1.6 }}>Your answers have been received. The academy office will be in touch.</p></div></div>`;

  const isLast = step === stages.length - 1;
  const current = stageIndexes(step);

  const logoAt = ["left", "centre", "right"].indexOf(state.logoPosition) >= 0 ? state.logoPosition : "left";
  const justify = { left: "flex-start", centre: "center", right: "flex-end" }[logoAt];
  const submitAt = ["left", "centre", "right"].indexOf(state.submitPosition) >= 0 ? state.submitPosition : "right";
  const topRow = html`<div style=${{ display: "flex", alignItems: "center", gap: "10px", justifyContent: justify, maxWidth: "640px", margin: "0 auto 14px" }}>
    ${state.logoUrl ? html`<img src=${state.logoUrl} alt="" style=${{ height: "40px", width: "auto" }} />` : null}
    ${state.headerText ? html`<strong style=${{ color: NAVY, fontSize: "15px", letterSpacing: ".02em", fontFamily: "Montserrat, Inter, system-ui, sans-serif" }}>${state.headerText}</strong>` : null}
  </div>`;
  const draftBtn = state.allowDraft !== false ? html`<button type="button" onClick=${saveDraft} style=${{ flex: "none", height: "44px", padding: "0 18px", border: "1px solid " + LINE, borderRadius: "999px", background: "#fff", color: NAVY, fontWeight: 700, fontSize: "15px", cursor: "pointer", width: "auto" }}>${state.draftLabel || "Save draft"}</button>` : null;
  const submitBtn = html`<button type="submit" disabled=${busy} style=${{ flex: "none", height: "44px", padding: "0 18px", border: 0, borderRadius: "999px", background: NAVY, color: "#fff", fontWeight: 700, fontSize: "15px", width: "auto", cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>${busy ? "Sending…" : (isLast ? (state.submitText || "Submit") : "Next")}</button>`;
  return html`<div style=${shell}>
    ${topRow}
    <form style=${card} onSubmit=${(e) => (isLast ? submit(e) : (e.preventDefault(), next()))}>
      ${state.eyebrow ? html`<p style=${{ fontSize: "11px", fontWeight: 800, letterSpacing: ".12em", textTransform: "uppercase", color: BLUE, margin: "0 0 4px" }}>${state.eyebrow}</p>` : null}
      <h1 style=${head}>${state.title || state.formName || ""}</h1>
      ${stages.length > 1 ? html`<div style=${{ margin: "18px 0 22px" }}>
        <div style=${{ display: "flex", gap: "6px", marginBottom: "10px" }}>
          ${stages.map((st, n) => html`<span key=${n} style=${{ flex: 1, height: "6px", borderRadius: "999px", background: n <= step ? BLUE : LINE }}></span>`)}
        </div>
        <div style=${{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style=${{ width: "28px", height: "28px", borderRadius: "50%", background: NAVY, color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "13px" }}>${step + 1}</span>
          ${state.showStepNumbers !== false ? html`<div style=${{ fontSize: "12px", color: MUTED, fontWeight: 600 }}>Step ${step + 1} of ${stages.length}</div>` : null}
        </div>
        <h2 style=${{ fontFamily: "Montserrat, Inter, system-ui, sans-serif", fontSize: "20px", fontWeight: 800, color: NAVY, margin: "12px 0 0", lineHeight: 1.25 }}>${stages[step].title || ("Step " + (step + 1))}</h2>
      </div>` : html`<div style=${{ height: "16px" }}></div>`}
      <style>.af-grid{display:grid;grid-template-columns:1fr;gap:18px}@media (min-width:760px){.af-grid{grid-template-columns:1fr 1fr}.af-full{grid-column:1 / -1}}</style>
      <div class="af-grid">
        ${current.map((i) => html`<div key=${i} class=${fields[i].width === "half" ? "af-half" : "af-full"}>
          <label style=${labelStyle}>${fields[i].label}${fields[i].required ? " *" : ""}</label>
          <${FieldInput} f=${fields[i]} i=${i} value=${values[i]} setValue=${setValue} locked=${fields[i].type === "email" && !!state.email} rules=${state.phoneRules || []} code=${values["c" + i]} setCode=${(c) => setValue("c" + i, c)} />
          ${fields[i].help ? html`<small style=${{ display: "block", color: MUTED, fontSize: "12px", marginTop: "6px" }}>${fields[i].help}</small>` : null}
        </div>`)}
      </div>
      ${err ? html`<p style=${{ color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "14px", padding: "10px 12px", margin: "18px 0 0", fontSize: "14px" }}>${err}</p>` : null}
      ${draftNote ? html`<p style=${{ color: "#166534", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "14px", padding: "10px 12px", margin: "18px 0 0", fontSize: "14px" }}>${draftNote}</p>` : null}
      <div style=${{ display: "flex", gap: "10px", marginTop: "24px", alignItems: "center", justifyContent: { left: "flex-start", centre: "center", right: "flex-end" }[submitAt] }}>
        ${step > 0 ? html`<button type="button" onClick=${() => { setErr(""); setStep(step - 1); }} style=${{ flex: "none", height: "44px", padding: "0 18px", border: "1px solid " + LINE, borderRadius: "999px", background: "#fff", color: NAVY, fontWeight: 700, fontSize: "15px", cursor: "pointer", marginRight: "auto" }}>Back</button>` : null}
        ${submitAt === "left" ? html`${submitBtn}${draftBtn}` : html`${draftBtn}${submitBtn}`}
      </div>
    </form>
  </div>`;
}
