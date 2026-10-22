/**
 * Validate a fee payment link token (query or body).
 * Used by /pay-fee?token=...
 */
import { db } from './firebaseAdmin.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

function json(status, body) {
  return { statusCode: status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const handler = async (event) => {
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
  if (!token || token.length < 12) return json(400, { valid: false, error: 'Missing or invalid payment link token' });

  try {
    const snap = await db.collection('feePaymentLinks').doc(token).get();
    if (!snap.exists) return json(200, { valid: false, error: 'This payment link is invalid.' });
    const link = snap.data() || {};

    if (link.deleted || link.trashed || link.revoked || link.active === false) {
      return json(200, { valid: false, error: 'This payment link has been revoked.' });
    }

    const exp = link.expiresAt;
    let expiresMs = null;
    if (exp && typeof exp.toDate === 'function') expiresMs = exp.toDate().getTime();
    else if (exp && exp._seconds) expiresMs = exp._seconds * 1000;
    else if (typeof exp === 'string' || typeof exp === 'number') expiresMs = new Date(exp).getTime();
    if (expiresMs && Date.now() > expiresMs) {
      return json(200, { valid: false, error: 'This payment link has expired. Ask the academy for a new link.' });
    }

    if (link.mode === 'single' && Number(link.usedCount || 0) >= 1) {
      return json(200, { valid: false, error: 'This single-use payment link has already been used.' });
    }
    if (link.maxUses != null && Number(link.usedCount || 0) >= Number(link.maxUses)) {
      return json(200, { valid: false, error: 'This payment link has reached its maximum number of uses.' });
    }

    // Payer check: only runs when the browser sends the email the payer typed
    const payerEmail = String((event.queryStringParameters && event.queryStringParameters.email) || '').toLowerCase().trim();
    let payerError = null;
    if (payerEmail) {
      const rule = link.payerRule || 'student';
      if (rule === 'email') {
        if (link.payerEmail && payerEmail !== String(link.payerEmail).toLowerCase().trim()) {
          payerError = 'This payment link is reserved for another email address. Use the email the academy has on file.';
        }
      } else if (rule === 'student') {
        const q = await db.collection('students').where('email', '==', payerEmail).limit(1).get();
        if (q.empty) payerError = 'We could not find a registered student with this email. Use the email the academy has on file.';
      }
    }

    let amount = Number(link.amount) || 0;
    let feeName = link.feeName || 'Fee';
    let feeType = link.feeType || 'custom';
    let description = link.description || '';
    let installmentsMax = Number(link.installmentsMax) || 1;
    let installmentIntervalDays = Number(link.installmentIntervalDays) || 30;

    if (link.feeId) {
      try {
        const feeSnap = await db.collection('feeDefinitions').doc(link.feeId).get();
        if (feeSnap.exists) {
          const fee = feeSnap.data() || {};
          if (fee.active === false) {
            return json(200, { valid: false, error: 'This fee is no longer active.' });
          }
          if (fee.amount != null) amount = Number(fee.amount);
          if (fee.name) feeName = fee.name;
          if (fee.type) feeType = fee.type;
          if (fee.description) description = fee.description;
          if (fee.installmentsMax) installmentsMax = Number(fee.installmentsMax);
          if (fee.installmentIntervalDays) installmentIntervalDays = Number(fee.installmentIntervalDays);
        }
      } catch (e) { /* use link snapshot */ }
    }

    return json(200, {
      valid: true,
      token,
      feeId: link.feeId || null,
      feeName,
      feeType,
      amount,
      description,
      installmentsMax,
      installmentIntervalDays,
      mode: link.mode || 'multi',
      expiresAt: expiresMs ? new Date(expiresMs).toISOString() : null,
      payerError
    });
  } catch (err) {
    console.error('validate-fee-link', err);
    return json(500, { valid: false, error: 'Could not check payment link. Try again later.' });
  }
};
