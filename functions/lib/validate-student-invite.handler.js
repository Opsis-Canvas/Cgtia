/**
 * Validate a one-time student profile invite token (query or body).
 * Used by /field-check/confirm?token=...
 */
const { db } = require('./firebaseAdmin');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(status, body) {
  return { statusCode: status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { error: 'Method Not Allowed' });
  }

  let token = '';
  if (event.httpMethod === 'GET') {
    token = (event.queryStringParameters && event.queryStringParameters.token) || '';
  } else {
    try {
      const body = JSON.parse(event.body || '{}');
      token = body.token || '';
    } catch {
      return json(400, { error: 'Invalid JSON' });
    }
  }
  token = String(token).trim();
  if (!token || token.length < 8) return json(400, { valid: false, error: 'Missing or invalid invite token' });

  try {
    const snap = await db.collection('studentInvites').doc(token).get();
    if (!snap.exists) return json(200, { valid: false, error: 'This invite link is invalid.' });
    const inv = snap.data() || {};
    if (inv.used) return json(200, { valid: false, error: 'This invite link has already been used.' });
    const exp = inv.expiresAt;
    let expiresMs = null;
    if (exp && typeof exp.toDate === 'function') expiresMs = exp.toDate().getTime();
    else if (exp && exp._seconds) expiresMs = exp._seconds * 1000;
    else if (typeof exp === 'string' || typeof exp === 'number') expiresMs = new Date(exp).getTime();
    if (expiresMs && Date.now() > expiresMs) {
      return json(200, { valid: false, error: 'This invite link has expired. Ask the academy for a new link.' });
    }
    return json(200, {
      valid: true,
      email: inv.email || '',
      fullName: inv.fullName || '',
      program: inv.program || '',
      expiresAt: expiresMs ? new Date(expiresMs).toISOString() : null
    });
  } catch (err) {
    console.error('validate-student-invite', err);
    return json(500, { valid: false, error: 'Could not check invite. Try again later.' });
  }
};
