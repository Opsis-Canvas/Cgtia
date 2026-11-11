/** Checks an exam link and returns the exam the visitor will sit. Used by /exam/take */
import { json, CORS, examFromLink, publicExam, deviceState, reqOf } from './exam-public.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const token = String((event.queryStringParameters && event.queryStringParameters.token) || '').trim();
  try {
    const r = await examFromLink(token);
    if (r.error) return json(200, { valid: false, error: r.error });
    const dev = await deviceState(token, String((event.queryStringParameters && event.queryStringParameters.device) || ''));
    const list = Array.isArray(r.link.allowed) ? r.link.allowed : [];
    const req = reqOf(r.link);
    const lock = r.link.lock || {};
    const restricted = list.length > 0 || req.email || req.reg || !!lock.name || !!lock.email || !!lock.reg;
    return json(200, { valid: true, ...publicExam(r.exam), device: dev, restricted, needsName: req.name, needsEmail: req.email || list.some((p) => !!p.email), needsReg: req.reg || list.some((p) => !!p.regNumber), places: list.length, placesLeft: list.filter((p) => !p.used).length });
  } catch (err) {
    console.error('exam-link', err);
    return json(500, { valid: false, error: 'Could not check this link. Try again later.' , detail: String((err && err.message) || err).slice(0, 200) });
  }
};
