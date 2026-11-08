/** Reports whether an attempt has been saved (the admin can see it). Used by the exam page while it sends. */
import { db } from './firebaseAdmin.js';
import { json, CORS } from './exam-public.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const id = String((event.queryStringParameters && event.queryStringParameters.sessionId) || '').trim();
  if (!id || id.length > 120) return json(400, { error: 'Missing session.' });
  try {
    const sub = await db.collection('examSubmissions').doc(id).get();
    if (!sub.exists) return json(200, { landed: false });
    const d = sub.data() || {};
    return json(200, { landed: true, pct: d.pct, score: d.score, total: d.total, resultMode: d.resultMode || 'instant' });
  } catch (err) {
    console.error('exam-status', err);
    return json(500, { landed: false, error: 'Could not check yet.' });
  }
};
