/**
 * Returns an open form for /apply-form?form=ID. Works only if the form is placed on at least one page.
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
  const id = String((event.queryStringParameters && event.queryStringParameters.form) || '').trim();
  if (!id || id.length > 120) return json(400, { valid: false, error: 'This form is not available.' });
  try {
    const snap = await db.collection('applyForms').doc(id).get();
    if (!snap.exists) return json(200, { valid: false, error: 'This form is not available.' });
    const f = snap.data() || {};
    if (f.trashed || !f.live || !Array.isArray(f.placements) || f.placements.length === 0) {
      return json(200, { valid: false, error: 'This form is not available.' });
    }
    return json(200, {
      valid: true,
      title: f.title || f.name || '',
      formName: f.name || '',
      submitText: f.submitText || 'Submit',
      fields: publicFields(f.fields),
      stages: publicStages(f.stages),
      ...publicLook(f),
      phoneRules: await loadPhoneRulesServer(db),
      allowDraft: f.allowDraft !== false,
      draftLabel: String(f.draftButtonText || 'Save draft').slice(0, 40)
    });
  } catch (err) {
    console.error('get-open-form', err);
    return json(500, { valid: false, error: 'Could not load this form. Try again later.' });
  }
};
