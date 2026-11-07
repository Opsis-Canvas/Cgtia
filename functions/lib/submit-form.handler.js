/**
 * Saves answers from a link form or an open form. Used by the form page.
 */
import { db, admin } from './firebaseAdmin.js';
import { publicFields, finishAnswers } from './form-public.js';
import { emailAdmin } from './admin-alert.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
function json(status, body) {
  return { statusCode: status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const token = String(body.token || '').trim();
  const formId = String(body.formId || '').trim();
  const answers = Array.isArray(body.answers) ? body.answers.slice(0, 60) : [];
  try {
    if (token) {
      if (token.length < 8) return json(400, { error: 'This link is not valid.' });
      const linkRef = db.collection('formLinks').doc(token);
      const snap = await linkRef.get();
      if (!snap.exists) return json(400, { error: 'This link is not valid.' });
      const l = snap.data() || {};
      if (l.revoked) return json(403, { error: 'This link has been cancelled.' });
      const exp = l.expiresAt ? new Date(l.expiresAt).getTime() : 0;
      if (exp && Date.now() > exp) return json(403, { error: 'This link has expired.' });
      if (l.maxUses > 0 && (l.uses || 0) >= l.maxUses) return json(403, { error: 'This link has already been used.' });
      const fields = publicFields((l.snapshot || {}).fields);
      const r = await finishAnswers(db, fields, answers);
      if (!r.ok) return json(400, { error: r.error });
      await db.collection('formSubmissions').add({
        formId: l.formId || '', formName: l.formName || '', token,
        answers: r.clean, submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await linkRef.update({ uses: (l.uses || 0) + 1 });
      await emailAdmin('New form answers: ' + (l.formName || 'form'), r.clean.map((a) => a.label + ': ' + a.value));
      return json(200, { ok: true });
    }
    if (formId) {
      const snap = await db.collection('applyForms').doc(formId).get();
      if (!snap.exists) return json(404, { error: 'This form is not available.' });
      const f = snap.data() || {};
      if (f.trashed || !f.live || !Array.isArray(f.placements) || f.placements.length === 0) {
        return json(404, { error: 'This form is not available.' });
      }
      const r = await finishAnswers(db, publicFields(f.fields), answers);
      if (!r.ok) return json(400, { error: r.error });
      await db.collection('formSubmissions').add({
        formId, formName: f.name || '', token: '',
        answers: r.clean, submittedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      await emailAdmin('New form answers: ' + (f.name || 'form'), r.clean.map((a) => a.label + ': ' + a.value));
      return json(200, { ok: true });
    }
    return json(400, { error: 'Missing form or link.' });
  } catch (err) {
    console.error('submit-form', err);
    return json(500, { error: 'Could not send your answers. Try again later.' });
  }
};
