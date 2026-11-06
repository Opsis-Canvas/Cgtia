/** Checks an exam link and returns the exam the visitor will sit. Used by /exam/take */
import { json, CORS, examFromLink, publicExam } from './exam-public.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const token = String((event.queryStringParameters && event.queryStringParameters.token) || '').trim();
  try {
    const r = await examFromLink(token);
    if (r.error) return json(200, { valid: false, error: r.error });
    return json(200, { valid: true, email: r.link.email || '', ...publicExam(r.exam) });
  } catch (err) {
    console.error('exam-link', err);
    return json(500, { valid: false, error: 'Could not check this link. Try again later.' });
  }
};
