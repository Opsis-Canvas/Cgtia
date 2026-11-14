/**
 * Batch links (walk-in students). Actions: info, lookup, submit.
 * A student is found only by the details the link asks for, and only one record can match.
 * Too many failed tries are blocked for 15 minutes. Changes are stored for review; nothing changes the record until approved.
 */
import { db } from './firebaseAdmin.js';
import { sendMail } from './email.js';

const J = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(obj) });
const norm = (x) => String(x || '').trim().toLowerCase().replace(/\s+/g, ' ');
const digits = (x) => String(x || '').replace(/\D/g, '').slice(-10);
const LABELS = { surname: 'Surname', middleName: 'Middle name', lastName: 'Last name', email: 'Email', phone: 'Phone', nin: 'NIN', dateOfBirth: 'Date of birth', nextOfKinName: 'Next of kin name', nextOfKinPhone: 'Next of kin phone', nextOfKinPhoneType: 'Next of kin phone type', residentialAddress: 'Residential address', permanentAddress: 'Permanent address', genotype: 'Genotype', bloodGroup: 'Blood group' };
const WINDOW_MS = 15 * 60 * 1000;
const MAX_TRIES = 5;

function valueOf(r, k) {
  if (k === 'nextOfKinName') return r.nextOfKinName || (r.nextOfKin || {}).name || '';
  if (k === 'nextOfKinPhone') return r.nextOfKinPhone || (r.nextOfKin || {}).phone || '';
  if (k === 'nextOfKinPhoneType') return r.nextOfKinPhoneType || (r.nextOfKin || {}).phoneType || '';
  return r[k] || '';
}
function fullOf(r) {
  return norm(r.fullLegalName || r.fullName || [r.surname, r.middleName, r.lastName].filter(Boolean).join(' '));
}
async function getLink(token) {
  if (!token || token.length < 12) return null;
  const d = await db.collection('batchLinks').doc(token).get();
  if (!d.exists) return null;
  const l = d.data() || {};
  if (l.revoked) return null;
  if (l.expiresAt && new Date(l.expiresAt) < new Date()) return null;
  return l;
}
async function findStudent(link, lookup) {
  const L = link.lookup || {};
  const snap = await db.collection('students').get();
  const hits = [];
  snap.forEach((d) => {
    const r = d.data() || {};
    if (r.trashed === true) return;
    if (L.name && norm(lookup.name) !== fullOf(r)) return;
    if (L.email && norm(lookup.email) !== norm(r.email)) return;
    if (L.mobile && digits(lookup.mobile) !== digits(r.phone)) return;
    hits.push({ id: d.id, data: r });
  });
  return hits;
}
// Failed tries are counted per link and per device address
function limitKey(token, event) {
  const ip = String((event.headers && (event.headers['cf-connecting-ip'] || event.headers['x-forwarded-for'])) || 'unknown').split(',')[0].trim();
  return ('lk_' + token.slice(0, 16) + '_' + ip).replace(/[^a-zA-Z0-9_]/g, '_');
}
async function attemptState(key) {
  const d = await db.collection('lookupAttempts').doc(key).get();
  return d.exists ? (d.data() || { n: 0, since: 0 }) : { n: 0, since: 0 };
}
async function recordFailure(key, a) {
  const fresh = Date.now() - (a.since || 0) >= WINDOW_MS;
  await db.collection('lookupAttempts').doc(key).set({ n: fresh ? 1 : (a.n || 0) + 1, since: fresh ? Date.now() : a.since });
}
async function clearFailures(key) {
  await db.collection('lookupAttempts').doc(key).set({ n: 0, since: 0 });
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return J(204, {});
  if (event.httpMethod !== 'POST') return J(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return J(400, { error: 'Bad request' }); }
  const token = String(body.token || '').trim();
  const link = await getLink(token);
  if (!link) return J(404, { valid: false, error: 'This link is not valid or has expired.' });

  if (body.action === 'info') return J(200, { valid: true, label: link.label || '', lookup: link.lookup || {} });

  const key = limitKey(token, event);
  const state = await attemptState(key);
  if (state.n >= MAX_TRIES && Date.now() - (state.since || 0) < WINDOW_MS) {
    return J(429, { error: 'Too many tries. Please wait 15 minutes, then try again.' });
  }

  const lookup = { name: String(body.name || ''), email: String(body.email || ''), mobile: String(body.mobile || '') };
  const L = link.lookup || {};
  if ((L.name && !lookup.name.trim()) || (L.email && !lookup.email.trim()) || (L.mobile && !lookup.mobile.trim())) {
    return J(400, { error: 'Fill in the details the academy asked for.' });
  }
  const hits = await findStudent(link, lookup);
  if (hits.length !== 1) {
    await recordFailure(key, state);
    return J(404, { error: 'We could not find a record that matches those details. Check them, or contact the academy.' });
  }
  await clearFailures(key);
  const rec = hits[0].data;
  const rules = link.rules || {};
  const keys = Object.keys(rules);
  const values = {};
  keys.forEach((k) => { values[k] = valueOf(rec, k); });

  if (body.action === 'lookup') return J(200, { found: true, rules, values });

  if (body.action === 'submit') {
    const changes = body.changes || {};
    const clean = {};
    keys.forEach((k) => { if (changes[k] !== undefined) clean[k] = String(changes[k]).trim().slice(0, 300); });
    if (Object.keys(clean).length === 0) return J(400, { error: 'Nothing has changed.' });
    const final = (k) => (k in clean ? clean[k] : values[k]);
    const missing = keys.filter((k) => rules[k] === 'required' && !String(final(k) || '').trim());
    if (missing.length) return J(400, { error: 'Please fill in: ' + missing.map((k) => LABELS[k] || k).join(', ') });
    if (clean.nin && clean.nin.replace(/\D/g, '').length !== 11) return J(400, { error: 'NIN must be 11 digits' });
    const now = new Date().toISOString();
    await db.collection('studentChangeRequests').add({
      studentId: hits[0].id, batchToken: token, changes: clean, before: values,
      status: 'pending', submittedAt: now, history: [{ at: now, action: 'submitted' }]
    });
    // the student gets a notice straight away, at the email on their record
    if (rec.email) {
      try {
        await sendMail({
          to: rec.email,
          subject: 'CGTIA: your changes are under review',
          text: 'Thank you. We received your changes. They are under review, and the academy will contact you if anything needs checking.'
        });
      } catch (e) { /* the request is saved even if the email cannot be sent */ }
    }
    return J(200, { ok: true, message: 'Your changes are under review. The academy will contact you.' });
  }
  return J(400, { error: 'Unknown action' });
};
