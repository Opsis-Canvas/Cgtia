/**
 * Lists open forms placed on one page, for the buttons that appear on that page.
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

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  let page = String((event.queryStringParameters && event.queryStringParameters.page) || '/').trim();
  page = page.replace(/\/$/, '') || '/';
  if (page.length > 100) return json(200, { forms: [] });
  try {
    const snap = await db.collection('applyForms').where('live', '==', true).limit(200).get();
    const forms = [];
    snap.forEach((d) => {
      const f = d.data() || {};
      if (f.trashed || !Array.isArray(f.placements) || !f.placements.includes(page)) return;
      const pos = ['left', 'centre', 'right'].indexOf(f.buttonPosition) >= 0 ? f.buttonPosition : 'centre';
      forms.push({ id: d.id, label: String(f.buttonLabel || f.name || 'Apply').slice(0, 60), position: pos });
    });
    return json(200, { forms });
  } catch (err) {
    console.error('open-forms', err);
    return json(200, { forms: [] });
  }
};
