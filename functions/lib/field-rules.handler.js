/** Required and optional fields, as set in admin. Read by the public invite. */
import { db } from './firebaseAdmin.js';
const J = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(obj) });
export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return J(405, { error: 'Method Not Allowed' });
  try {
    const d = await db.collection('settings').doc('studentFields').get();
    return J(200, { rules: d.exists ? ((d.data() || {}).rules || {}) : {} });
  } catch (e) { return J(500, { rules: {} }); }
};
