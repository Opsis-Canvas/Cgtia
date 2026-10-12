const { db } = require('./firebaseAdmin');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};
function json(s, b) {
  return { statusCode: s, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(b) };
}
exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  const token = ((event.queryStringParameters || {}).token || '').trim();
  if (!token) return json(400, { valid: false, error: 'Missing token' });
  try {
    const snap = await db.collection('licensingInvites').doc(token).get();
    if (!snap.exists) return json(200, { valid: false, error: 'Invalid invite link' });
    const inv = snap.data() || {};
    if (inv.used) return json(200, { valid: false, error: 'This link was already used' });
    let exp = inv.expiresAt;
    let ms = null;
    if (exp && exp.toDate) ms = exp.toDate().getTime();
    else if (exp && exp._seconds) ms = exp._seconds * 1000;
    else if (exp) ms = new Date(exp).getTime();
    if (ms && Date.now() > ms) return json(200, { valid: false, error: 'This link has expired' });
    return json(200, {
      valid: true,
      email: inv.email || '',
      fullName: inv.fullName || '',
      isCgtiaStudent: !!inv.isCgtiaStudent,
      expiresAt: ms ? new Date(ms).toISOString() : null
    });
  } catch (e) {
    return json(500, { valid: false, error: 'Could not validate invite' });
  }
};
