/**
 * Public verification lookup. Returns only the fields ticked in the admin's
 * "Verification display" page, and never returns a record that is in Trash.
 */
import { db } from './firebaseAdmin.js';

// Admin field keys -> the stored field names they cover
const CATALOGUE = {
  name: ['studentName', 'fullName', 'fullLegalName', 'holderName'],
  regNumber: ['regNumber'],
  program: ['program', 'programName'],
  cohort: ['cohort'],
  grade: ['grade'],
  category: ['category'],
  status: ['status'],
  issueDate: ['issueDate'],
  expiryDate: ['expiryDate'],
  renewedAt: ['renewedAt'],
  code: ['certificateCode', 'code'],
  licenceNumber: ['licenceNumber'],
  photo: ['photo', 'photoUrl']
};

// Status flags are always returned so the page can show a revoked or suspended record
const ALWAYS = ['revoked', 'suspended', 'banned'];

const DEFAULT_SHOWN = {
  certificate: ['name', 'regNumber', 'program', 'issueDate', 'code', 'status'],
  'id-card': ['name', 'regNumber', 'program', 'issueDate', 'expiryDate', 'code', 'status', 'photo'],
  licence: ['name', 'licenceNumber', 'category', 'expiryDate', 'renewedAt', 'status'],
  student: ['name', 'regNumber', 'program', 'cohort', 'status', 'photo']
};

async function shownKeys(kind) {
  try {
    const snap = await db.collection('siteContent').doc('verifySettings').get();
    const data = snap.exists ? (snap.data() || {}) : {};
    if (Array.isArray(data[kind])) return data[kind];
  } catch (e) {
    // fall back to the defaults if settings cannot be read
  }
  return DEFAULT_SHOWN[kind] || [];
}

function publicRecord(id, data, keys) {
  const out = { id };
  keys.forEach((key) => {
    (CATALOGUE[key] || []).forEach((field) => {
      if (data[field] !== undefined && data[field] !== null && out[field] === undefined) out[field] = data[field];
    });
  });
  ALWAYS.forEach((field) => {
    if (data[field] !== undefined && data[field] !== null) out[field] = data[field];
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
    const keys = await shownKeys(kind);
    return json(200, { valid: true, record: publicRecord(hit.id, hit.data, keys) });
  } catch (e) {
    return json(500, { valid: false, error: 'Verification is unavailable right now. Please try again.' });
  }
};
