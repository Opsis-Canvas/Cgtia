/**
 * Client-side backup after Paystack popup success.
 * Verifies the transaction with Paystack secret, then records payment.
 * Handles both tuition applications AND fee-link payments.
 */
import { admin, db } from './firebaseAdmin.js';
import { provisionStudentAccount, recordInstallmentPayment } from './provisioning.js';

async function verifyPaystackReference(reference) {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !reference) return null;
  const res = await fetch('https://api.paystack.co/transaction/verify/' + encodeURIComponent(reference), {
    headers: { Authorization: 'Bearer ' + secret }
  });
  const json = await res.json();
  if (!json.status || !json.data || json.data.status !== 'success') return null;
  return json.data;
}

async function recordFeePayment(data, body) {
  const meta = (data && data.metadata) || {};
  const email = (
    body.email ||
    meta.studentEmail ||
    (data.customer && data.customer.email) ||
    ''
  ).toLowerCase().trim();
  const regNumber = (body.regNumber || meta.regNumber || '').trim();
  const fullName = (body.fullName || meta.fullName || '').trim();
  const feeId = body.feeId || meta.feeId || null;
  const feeName = body.feeName || meta.feeName || meta.feeType || 'Fee';
  const feeType = body.feeType || meta.feeType || 'custom';
  const feeLinkToken = body.feeLinkToken || meta.feeLinkToken || null;
  const amountNaira = (data.amount || 0) / 100;
  const reference = data.reference || body.reference || '';
  const channel = data.channel || 'card';

  let studentId = meta.studentId || null;
  if (!studentId && email) {
    try {
      const q = await db.collection('students').where('email', '==', email).limit(1).get();
      if (!q.empty) studentId = q.docs[0].id;
    } catch (e) { /* ignore */ }
  }
  if (!studentId && regNumber) {
    try {
      const q = await db.collection('students').where('regNumber', '==', regNumber).limit(1).get();
      if (!q.empty) studentId = q.docs[0].id;
    } catch (e) { /* ignore */ }
  }

  const payId = reference || ('fee_' + Date.now().toString(36));
  const existing = await db.collection('payments').doc(payId).get();
  if (existing.exists && (existing.data() || {}).status === 'paid') {
    return { recorded: true, already: true, payId, studentId };
  }

  await db.collection('payments').doc(payId).set({
    fullName: fullName || (data.customer && ((data.customer.first_name || '') + ' ' + (data.customer.last_name || '')).trim()) || '',
    email,
    regNumber: regNumber || null,
    studentId: studentId || null,
    amount: amountNaira,
    amountPaid: amountNaira,
    method: channel,
    channel,
    status: 'paid',
    paymentStatus: 'paid',
    feeId,
    feeName,
    feeType,
    purpose: feeType,
    program: feeType,
    installmentsTotal: Number(body.installmentsTotal || meta.installmentsTotal) || 1,
    installmentsPaid: Number(body.installmentNumber || meta.installmentNumber) || 1,
    reference,
    paystackReference: reference,
    source: 'fee-link',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: meta
  }, { merge: true });

  if (feeLinkToken) {
    try {
      const linkRef = db.collection('feePaymentLinks').doc(feeLinkToken);
      const linkSnap = await linkRef.get();
      if (linkSnap.exists) {
        const link = linkSnap.data() || {};
        // Avoid double-counting if webhook already incremented for same reference
        const payers = Array.isArray(link.recentPayers) ? link.recentPayers.slice() : [];
        const alreadyListed = payers.some((p) => p.reference === reference);
        if (!alreadyListed) {
          const used = Number(link.usedCount || 0) + 1;
          payers.unshift({
            email,
            fullName: fullName || '',
            regNumber: regNumber || '',
            amount: amountNaira,
            reference,
            paidAt: new Date().toISOString()
          });
          const updates = {
            usedCount: used,
            recentPayers: payers.slice(0, 50),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          if (link.mode === 'single' || (link.maxUses != null && used >= Number(link.maxUses))) {
            updates.active = false;
          }
          await linkRef.set(updates, { merge: true });
        }
      }
    } catch (e) {
      console.error('fee link update', e);
    }
  }

  return { recorded: true, payId, studentId };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const reference = body.reference;
  if (!reference) {
    return { statusCode: 400, body: JSON.stringify({ error: 'reference required' }) };
  }

  try {
    const data = await verifyPaystackReference(reference);
    if (!data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Payment not verified' }) };
    }

    const meta = data.metadata || {};
    const isFee =
      body.source === 'fee-link' ||
      meta.source === 'fee-link' ||
      body.feeId ||
      meta.feeId ||
      meta.feeType;

    if (isFee) {
      const result = await recordFeePayment(data, body);
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, recorded: true, ...result })
      };
    }

    // ---- Existing application / tuition path ----
    let applicationId = (body.applicationId || '').toLowerCase().trim();
    if (data.metadata && data.metadata.applicationId) {
      applicationId = String(data.metadata.applicationId).toLowerCase().trim();
    }
    if (!applicationId && data.customer && data.customer.email) {
      applicationId = String(data.customer.email).toLowerCase().trim();
    }
    if (!applicationId) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No applicationId' }) };
    }

    const appRef = db.collection('applications').doc(applicationId);
    const appSnap = await appRef.get();
    if (!appSnap.exists) {
      await appRef.set({
        email: applicationId,
        fullName: (data.metadata && data.metadata.custom_fields && data.metadata.custom_fields.find(f => f.variable_name === 'full_name') || {}).value || '',
        program: (data.metadata && data.metadata.custom_fields && data.metadata.custom_fields.find(f => f.variable_name === 'program') || {}).value || '',
        status: 'pending',
        paymentStatus: 'unpaid',
        paymentPlan: 'full',
        installmentsTotal: 1,
        installmentsPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    const appData = (await appRef.get()).data();
    const alreadyPaid = appData.paymentStatus === 'paid' || (appData.installmentsPaid || 0) >= (appData.installmentsTotal || 1);

    if (!alreadyPaid) {
      const { installmentsPaid, previousInstallmentsPaid } = await recordInstallmentPayment(
        appRef, appData, data.channel || 'card', reference
      );
      if (previousInstallmentsPaid === 0 && installmentsPaid >= 1) {
        await provisionStudentAccount(applicationId, { ...appData, email: applicationId });
      }
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, applicationId }) };
  } catch (err) {
    console.error('confirm-paystack-client', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message || 'failed' }) };
  }
};
