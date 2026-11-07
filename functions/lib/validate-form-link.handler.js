/**
 * Checks a one-time or several-person form link. Used by /apply-form/confirm?token=...
 */
import { db } from './firebaseAdmin.js';
import { publicFields, publicStages, loadPhoneRulesServer, publicLook } from './form-public.js';

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
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const token = String((event.queryStringParameters && event.queryStringParameters.token) || '').trim();
  if (!token || token.length < 8) return json(400, { valid: false, error: 'This link is not valid.' });
  try {
    const snap = await db.collection('formLinks').doc(token).get();
    if (!snap.exists) return json(200, { valid: false, error: 'This link is not valid.' });
    const l = snap.data() || {};
    if (l.revoked) return json(200, { valid: false, error: 'This link has been cancelled. Ask the academy for a new one.' });
    const exp = l.expiresAt ? new Date(l.expiresAt).getTime() : 0;
    if (exp && Date.now() > exp) return json(200, { valid: false, error: 'This link has expired. Ask the academy for a new one.' });
    if (l.maxUses > 0 && (l.uses || 0) >= l.maxUses) return json(200, { valid: false, error: 'This link has already been used.' });
    const s = l.snapshot || {};
    return json(200, {
      valid: true,
      title: s.title || l.formName || '',
      formName: l.formName || '',
      submitText: s.submitText || 'Submit',
      fields: publicFields(s.fields),
      stages: publicStages(s.stages),
      email: l.email || '',
      expiresAt: l.expiresAt || null,
      ...publicLook(s),
      phoneRules: await loadPhoneRulesServer(db),
      allowDraft: s.allowDraft !== false,
      draftLabel: String(s.draftButtonText || 'Save draft').slice(0, 40)
    });
  } catch (err) {
    console.error('validate-form-link', err);
    return json(500, { valid: false, error: 'Could not check this link. Try again later.' });
  }
};
