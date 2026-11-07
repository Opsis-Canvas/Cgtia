/**
 * Save and load a draft for a link form. A draft is kept per link. It does not count as a use.
 * GET  ?token=...       -> { answers: [{label, value}] }
 * POST { token, answers } -> { ok: true, savedAt }
 */
import { db } from './firebaseAdmin.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
function json(status, body) {
  return { statusCode: status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

async function linkStillOpen(token) {
  if (!token || token.length < 8) return null;
  const snap = await db.collection('formLinks').doc(token).get();
  if (!snap.exists) return null;
  const l = snap.data() || {};
  if (l.revoked) return null;
  const exp = l.expiresAt ? new Date(l.expiresAt).getTime() : 0;
  if (exp && Date.now() > exp) return null;
  return l;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  try {
    if (event.httpMethod === 'GET') {
      const token = String((event.queryStringParameters && event.queryStringParameters.token) || '').trim();
      const l = await linkStillOpen(token);
      if (!l) return json(200, { answers: [] });
      const snap = await db.collection('formDrafts').doc(token).get();
      const d = snap.exists ? (snap.data() || {}) : {};
      return json(200, { answers: Array.isArray(d.answers) ? d.answers : [] });
    }
    if (event.httpMethod === 'POST') {
      let body = {};
      try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
      const token = String(body.token || '').trim();
      const l = await linkStillOpen(token);
      if (!l) return json(403, { error: 'This link is no longer open, so the draft could not be saved.' });
      const clean = (Array.isArray(body.answers) ? body.answers : []).slice(0, 60).map((a) => ({
        label: String((a && a.label) || '').slice(0, 200),
        value: String((a && a.value) == null ? '' : Array.isArray(a.value) ? a.value.join(', ') : a.value).slice(0, 2000)
      }));
      const savedAt = new Date().toISOString();
      await db.collection('formDrafts').doc(token).set({ answers: clean, savedAt });
      return json(200, { ok: true, savedAt });
    }
    return json(405, { error: 'Method Not Allowed' });
  } catch (err) {
    console.error('form-draft', err);
    return json(500, { error: 'Could not save the draft. Try again.' });
  }
};
