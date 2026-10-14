/**
 * Public verification lookup. Returns only the fields the verify page shows,
 * and never returns a record that is in Trash.
 */
import { db } from './firebaseAdmin.js';

const PUBLIC_FIELDS = [
  'code', 'certificateCode', 'regNumber', 'studentName', 'fullName', 'fullLegalName', 'holderName',
  'program', 'programName', 'cohort', 'grade', 'category', 'status', 'issueDate', 'expiryDate',
  'renewedAt', 'photo', 'photoUrl', 'licenceNumber', 'revoked', 'suspended', 'banned'
];

function publicRecord(id, data) {
  const out = { id };
  PUBLIC_FIELDS.forEach((k) => {
    if (data[k] !== undefined && data[k] !== null) out[k] = data[k];
  });
  return out;
}

async function byId(col, id) {
  if (!id) return null;
  const snap = await db.collection(col).doc(id).get();
  if (!snap.exists) return null;
  return { id: snap.id, data: snap.data() || {} };
}

async function byField(col, field, value) {
  const snap = await db.collection(col).where(field, '==', value).limit(1).get();
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, data: d.data() || {} };
}

async function findByCode(col, q) {
  const upper = q.toUpperCase();
  return (await byId(col, upper)) || (await byId(col, q)) || (await byField(col, 'code', upper));
}

const SOURCES = {
  certificate: (q) => findByCode('certificates', q),
  'id-card': (q) => findByCode('idCards', q),
  licence: (q) => findByCode('licences', q),
  student: async (q) => (await byField('students', 'regNumber', q)) || (await byId('students', q))
};

const json = (statusCode, body) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  body: JSON.stringify(body)
});

export const handler = async (event) => {
  const params = event.queryStringParameters || {};
  const kind = String(params.kind || '');
  const q = String(params.q || '').trim();
  if (!Object.prototype.hasOwnProperty.call(SOURCES, kind) || !q || q.length > 64) {
    return json(400, { valid: false, error: 'Unknown verification request.' });
  }
  try {
    const hit = await SOURCES[kind](q);
    if (!hit || hit.data.trashed === true || hit.data.deleted === true) {
      return json(200, { valid: false });
    }
    return json(200, { valid: true, record: publicRecord(hit.id, hit.data) });
  } catch (e) {
    return json(500, { valid: false, error: 'Verification is unavailable right now. Please try again.' });
  }
};
