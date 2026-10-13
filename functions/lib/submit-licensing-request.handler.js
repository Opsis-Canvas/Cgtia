/**
 * Public licensing REQUEST (interest form on /licensing)
 * Does not issue a licence — staff review in admin.
 */
import { db, admin } from './firebaseAdmin.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function bad(status, error) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ error }) };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return bad(405, 'Method Not Allowed');

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return bad(400, 'Invalid JSON'); }

  const fullName = String(body.fullName || '').trim();
  const email = String(body.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const isCgtiaStudent = body.isCgtiaStudent === true || body.isCgtiaStudent === 'yes' || body.isCgtiaStudent === 'true';
  const regNumber = String(body.regNumber || '').trim();
  const trainingBackground = String(body.trainingBackground || '').trim();
  const message = String(body.message || '').trim();

  if (!fullName || !email || !phone) return bad(400, 'Name, email and phone are required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(400, 'Invalid email');

  const id = email.replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

  try {
    await db.collection('licensingRequests').doc(id).set({
      fullName,
      email,
      phone,
      isCgtiaStudent: !!isCgtiaStudent,
      regNumber: isCgtiaStudent ? regNumber : '',
      trainingBackground,
      message,
      status: 'new',
      source: 'licensing-page',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id }) };
  } catch (err) {
    console.error(err);
    return bad(500, 'Could not submit request');
  }
};
