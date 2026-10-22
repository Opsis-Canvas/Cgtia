/**
 * Delivery check for the admin. Answers one question only: does the website's
 * data already hold the version the admin just saved? Returns true or false.
 */
import { db } from './firebaseAdmin.js';

const ALLOWED = ['siteContent', 'promotions', 'programs'];

const json = (statusCode, body) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(body)
});

export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const parts = String(params.path || '').split('/');
  const token = String(params.token || '');
  if (parts.length !== 2 || ALLOWED.indexOf(parts[0]) < 0 ||
      !/^[A-Za-z0-9_-]{1,60}$/.test(parts[1]) || !/^[a-z0-9]{6,40}$/i.test(token)) {
    return json(400, { found: false });
  }
  try {
    const snap = await db.collection(parts[0]).doc(parts[1]).get();
    const found = snap.exists && (snap.data() || {}).publishToken === token;
    return json(200, { found: !!found });
  } catch (e) {
    return json(500, { found: false });
  }
};
