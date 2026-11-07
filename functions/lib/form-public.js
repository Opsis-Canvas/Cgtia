/**
 * Shared helpers for forms built in the admin.
 * publicFields(): only the parts a person needs, with lengths capped.
 * checkAnswers(): checks required answers on the server and cleans what is saved.
 */
const ALLOWED = ['text', 'email', 'phone', 'date', 'long', 'select', 'choice', 'checkbox'];

export function publicFields(list) {
  return (Array.isArray(list) ? list : []).slice(0, 60).map((f) => ({
    label: String((f && f.label) || '').slice(0, 200),
    type: ALLOWED.includes(f && f.type) ? f.type : 'text',
    required: !!(f && f.required),
    width: f && f.width === 'half' ? 'half' : 'full',
    stage: Math.max(1, parseInt(f && f.stage, 10) || 1),
    help: String((f && f.help) || '').slice(0, 300),
    options: (Array.isArray(f && f.options) ? f.options : []).slice(0, 30).map((o) => String(o).slice(0, 120))
  })).filter((f) => f.label);
}

export function publicStages(list) {
  const out = (Array.isArray(list) ? list : []).slice(0, 12).map((s, k) => ({
    title: String((s && s.title) || ('Step ' + (k + 1))).slice(0, 80)
  }));
  return out.length ? out : [{ title: 'Step 1' }];
}

export function checkAnswers(fields, answers) {
  const clean = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    const a = Array.isArray(answers) ? answers[i] : undefined;
    let value = a && a.value !== undefined ? a.value : '';
    if (Array.isArray(value)) value = value.join(', ');
    value = String(value == null ? '' : value).trim().slice(0, 2000);
    if (f.required && !value) return { ok: false, error: 'Please answer: ' + f.label };
    clean.push({ label: f.label, type: f.type, value });
  }
  return { ok: true, clean };
}

// Phone rules: the same list the Countries tab edits. Used for the country dropdown and the checks.
export const DEFAULT_PHONE_RULES = [
  { code: 'NG', name: 'Nigeria', dial: '+234', minTyped: 10, maxTyped: 11, trunkZero: true },
  { code: 'GH', name: 'Ghana', dial: '+233', minTyped: 9, maxTyped: 10, trunkZero: true },
  { code: 'KE', name: 'Kenya', dial: '+254', minTyped: 9, maxTyped: 10, trunkZero: true },
  { code: 'ZA', name: 'South Africa', dial: '+27', minTyped: 9, maxTyped: 10, trunkZero: true },
  { code: 'GB', name: 'United Kingdom', dial: '+44', minTyped: 10, maxTyped: 11, trunkZero: true },
  { code: 'US', name: 'United States or Canada', dial: '+1', minTyped: 10, maxTyped: 10, trunkZero: false }
];

export function publicPhoneRules(list) {
  const src = Array.isArray(list) && list.length ? list : DEFAULT_PHONE_RULES;
  return src.slice(0, 40).map((r) => ({
    code: String((r && r.code) || '').toUpperCase().slice(0, 3),
    name: String((r && (r.name || r.code)) || '').slice(0, 60),
    dial: String((r && r.dial) || '').slice(0, 6),
    minTyped: Number(r && r.minTyped) || 1,
    maxTyped: Number(r && r.maxTyped) || 15,
    trunkZero: !!(r && r.trunkZero)
  })).filter((r) => r.code && r.dial);
}

export async function loadPhoneRulesServer(db) {
  try {
    const snap = await db.collection('siteContent').doc('applyForm').get();
    const d = snap.exists ? (snap.data() || {}) : {};
    return publicPhoneRules(d.phoneRules);
  } catch (e) {
    return publicPhoneRules(null);
  }
}

// Turns "NG 08136548888" (the code the person chose, then the digits) into +2348136548888
export function normalisePhoneServer(raw, rules, code) {
  const list = publicPhoneRules(rules);
  const rule = list.find((r) => r.code === String(code || '').toUpperCase()) || list[0];
  let digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return { ok: false, error: 'Enter your phone number.' };
  const dd = rule.dial.replace(/\D/g, '');
  if (digits.startsWith(dd) && digits.length > rule.maxTyped) digits = digits.slice(dd.length);
  let national = digits;
  if (rule.trunkZero && national.startsWith('0')) national = national.slice(1);
  const need = rule.maxTyped - (rule.trunkZero ? 1 : 0);
  if (national.length !== need) {
    return { ok: false, error: 'Enter your ' + rule.name + ' phone number: ' + rule.maxTyped + ' digits, or ' + (rule.maxTyped - 1) + ' without the 0.' };
  }
  return { ok: true, e164: rule.dial + national };
}

// Checks answers, then turns each phone answer into a stored international number
export async function finishAnswers(db, fields, answers) {
  const r = checkAnswers(fields, answers);
  if (!r.ok) return r;
  const rules = await loadPhoneRulesServer(db);
  for (let i = 0; i < fields.length; i++) {
    if (fields[i].type !== 'phone') continue;
    const raw = String(r.clean[i].value || '');
    if (!raw.trim()) continue;
    const space = raw.indexOf(' ');
    const code = space > 0 ? raw.slice(0, space) : '';
    const digits = space > 0 ? raw.slice(space + 1) : raw;
    const n = normalisePhoneServer(digits, rules, code);
    if (!n.ok) return { ok: false, error: n.error };
    r.clean[i].value = n.e164;
  }
  return r;
}

// Top of the form: small line, brand text, logo and where the buttons sit (all optional, all sanitised)
export function publicLook(src) {
  const url = String((src && src.logoUrl) || '').trim();
  const pos = (v, ok, d) => (ok.indexOf(v) >= 0 ? v : d);
  return {
    eyebrow: String((src && src.eyebrow) || '').slice(0, 80),
    headerText: String((src && src.headerText) || '').slice(0, 60),
    logoUrl: /^(https:\/\/|\/)/.test(url) ? url.slice(0, 400) : '',
    logoPosition: pos(src && src.logoPosition, ['left', 'centre', 'right'], 'left'),
    submitPosition: pos(src && src.submitPosition, ['left', 'centre', 'right'], 'right'),
    showStepNumbers: !(src && src.showStepNumbers === false)
  };
}
