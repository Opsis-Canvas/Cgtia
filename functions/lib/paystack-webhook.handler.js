/**
 * Paystack webhook — configure this URL in the Paystack dashboard
 */

import crypto from 'crypto';
import { admin, db } from './firebaseAdmin.js';
import { provisionStudentAccount, recordInstallmentPayment } from './provisioning.js';

export const handler = async (event) => {
  console.log('🔔 ===== PAYSTACK WEBHOOK RECEIVED =====');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  
  const signature = event.headers['x-paystack-signature'];
  const secret = process.env.PAYSTACK_SECRET_KEY;
  
  console.log('🔑 Signature present?', !!signature);
  console.log('🔑 Secret present?', !!secret);
  
  if (!signature || !secret) {
    console.error('❌ Missing signature or secret');
    return { statusCode: 401, body: 'Missing signature or secret' };
  }
  
  const expected = crypto.createHmac('sha512', secret).update(event.body).digest('hex');
  console.log('🔐 Signature matches?', signature === expected);
  
  if (signature !== expected) {
    console.error('❌ Invalid signature');
    return { statusCode: 401, body: 'Invalid signature' };
  }
  
  let payload;
  try {
    payload = JSON.parse(event.body);
    console.log('📦 Event type:', payload.event);
  } catch (err) {
    console.error('❌ Invalid JSON:', err);
    return { statusCode: 400, body: 'Invalid JSON' };
  }
  
  if (payload.event !== 'charge.success') {
    console.log('⏭️ Ignoring event:', payload.event);
    return { statusCode: 200, body: 'Ignored' };
  }
  
  const data = payload.data || {};
  
  // ===== CRITICAL LOGGING: See what Paystack sent =====
  console.log('💳 Payment data received:', JSON.stringify(data, null, 2));
  console.log('📧 Reference from Paystack:', data.reference);
  console.log('📧 Customer email:', data.customer ? data.customer.email : 'No customer');
  console.log('📧 Customer code:', data.customer ? data.customer.customer_code : 'No customer');
  console.log('📧 Channel:', data.channel || 'Unknown');
  console.log('📧 Metadata:', data.metadata ? JSON.stringify(data.metadata) : 'No metadata');

  const meta = data.metadata || {};
  // ============================================================
  // FEE PAYMENT PATH (graduation, clinical, internship, etc.)
  // ============================================================
  if (meta.source === 'fee-link' || meta.feeId || meta.feeType) {
    console.log('💰 Fee payment detected via metadata');
    try {
      const email = (meta.studentEmail || (data.customer && data.customer.email) || '').toLowerCase().trim();
      const regNumber = (meta.regNumber || '').trim();
      const feeId = meta.feeId || null;
      const feeName = meta.feeName || meta.feeType || 'Fee';
      const feeType = meta.feeType || 'custom';
      const amountKobo = data.amount || 0;
      const amountNaira = amountKobo / 100;
      const reference = data.reference || '';
      const channel = data.channel || 'card';

      let studentId = meta.studentId || null;
      if (!studentId && email) {
        const q = await db.collection('students').where('email', '==', email).limit(1).get();
        if (!q.empty) studentId = q.docs[0].id;
      }
      if (!studentId && regNumber) {
        const q = await db.collection('students').where('regNumber', '==', regNumber).limit(1).get();
        if (!q.empty) studentId = q.docs[0].id;
      }

      const payId = reference || ('fee_' + Date.now().toString(36));
      await db.collection('payments').doc(payId).set({
        fullName: meta.fullName || (data.customer && (data.customer.first_name + ' ' + data.customer.last_name)) || '',
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
        installmentsTotal: Number(meta.installmentsTotal) || 1,
        installmentsPaid: Number(meta.installmentNumber) || 1,
        reference,
        paystackReference: reference,
        source: 'fee-link',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        paidAt: admin.firestore.FieldValue.serverTimestamp(),
        metadata: meta
      }, { merge: true });

      if (meta.feeLinkToken) {
        const linkRef = db.collection('feePaymentLinks').doc(meta.feeLinkToken);
        const linkSnap = await linkRef.get();
        if (linkSnap.exists) {
          const link = linkSnap.data() || {};
          const payers = Array.isArray(link.recentPayers) ? link.recentPayers.slice() : [];
          const alreadyListed = payers.some((p) => p.reference === reference);
          if (!alreadyListed) {
            const used = Number(link.usedCount || 0) + 1;
            payers.unshift({
              email,
              fullName: meta.fullName || '',
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
      }

      console.log('✅ Fee payment recorded:', payId, 'studentId:', studentId);
      return { statusCode: 200, body: 'Fee payment recorded' };
    } catch (feeErr) {
      console.error('Fee payment handling error:', feeErr);
      return { statusCode: 200, body: 'Fee handling error acknowledged' };
    }
  }
  
  let appRef = null;
  let appData = null;
  
  // ============================================================
  // 1. PRIMARY MATCH: Use metadata.applicationId (frontend sends this)
  // ============================================================
  const appIdFromMetadata = data.metadata && data.metadata.applicationId;
  if (appIdFromMetadata) {
    console.log('🔍 [PRIMARY] Looking up by metadata.applicationId:', appIdFromMetadata);
    console.log('📄 Full path: applications/' + appIdFromMetadata);
    const candidate = db.collection('applications').doc(appIdFromMetadata);
    const snap = await candidate.get();
    if (snap.exists) {
      appRef = candidate;
      appData = snap.data();
      console.log('✅ [PRIMARY] Found application by metadata.applicationId!');
      console.log('📄 Application email:', appData.email);
    } else {
      console.log('❌ [PRIMARY] NO application found with metadata.applicationId:', appIdFromMetadata);
    }
  }
  
  // ============================================================
  // 2. FALLBACK 1: Try by reference (Paystack might have preserved it)
  // ============================================================
  if (!appRef && data.reference) {
    console.log('🔍 [FALLBACK 1] Looking up by reference:', data.reference);
    console.log('📄 Full path: applications/' + data.reference);
    const candidate = db.collection('applications').doc(data.reference);
    const snap = await candidate.get();
    if (snap.exists) {
      appRef = candidate;
      appData = snap.data();
      console.log('✅ [FALLBACK 1] Found application by reference!');
    } else {
      console.log('❌ [FALLBACK 1] No application found by reference:', data.reference);
    }
  }
  
  // ============================================================
  // 3. FALLBACK 2: Try by customer_code (DVA path)
  // ============================================================
  if (!appRef && data.customer && data.customer.customer_code) {
    console.log('🔍 [FALLBACK 2] Looking up by customer_code:', data.customer.customer_code);
    const q = await db.collection('applications')
      .where('paystackCustomerCode', '==', data.customer.customer_code)
      .limit(1)
      .get();
    if (!q.empty) {
      appRef = q.docs[0].ref;
      appData = q.docs[0].data();
      console.log('✅ [FALLBACK 2] Found application by customer_code!');
    } else {
      console.log('❌ [FALLBACK 2] No application found by customer_code');
    }
  }
  
  // ============================================================
  // 4. FALLBACK 3: Try by account number
  // ============================================================
  if (!appRef && data.authorization && data.authorization.receiver_bank_account_number) {
    console.log('🔍 [FALLBACK 3] Looking up by account number:', data.authorization.receiver_bank_account_number);
    const q = await db.collection('applications')
      .where('virtualAccountNumber', '==', data.authorization.receiver_bank_account_number)
      .limit(1)
      .get();
    if (!q.empty) {
      appRef = q.docs[0].ref;
      appData = q.docs[0].data();
      console.log('✅ [FALLBACK 3] Found application by account number!');
    } else {
      console.log('❌ [FALLBACK 3] No application found by account number');
    }
  }
  
  // ============================================================
  // 5. Check if we found anything
  // ============================================================
  if (!appRef) {
    console.error('❌❌❌ COULD NOT MATCH PAYMENT TO ANY APPLICATION!');
    console.error('🔍 Metadata.applicationId searched:', data.metadata ? data.metadata.applicationId : 'None');
    console.error('🔍 Reference searched:', data.reference || 'None');
    console.error('🔍 Customer code searched:', data.customer ? data.customer.customer_code : 'None');
    console.error('🔍 Account number searched:', data.authorization ? data.authorization.receiver_bank_account_number : 'None');
    return { statusCode: 200, body: 'No matching application — acknowledged' };
  }
  
  console.log('✅ MATCH FOUND! Updating payment...');
  console.log('📄 Application ID:', appRef.id);
  console.log('📄 Application email:', appData.email);
  
  try {
    const ch = String(data.channel || data.authorization?.channel || '').toLowerCase();
    let method = 'card';
    if (ch.includes('transfer') || ch === 'dedicated_nuban' || ch === 'bank' || ch === 'bank_transfer') method = 'bank_transfer';
    else if (ch === 'ussd') method = 'ussd';
    else if (ch === 'qr') method = 'qr';
    else if (ch.includes('mobile')) method = 'mobile_money';
    else if (ch) method = ch;
    console.log('💰 Recording installment payment with method:', method);
    const { installmentsPaid, previousInstallmentsPaid } = await recordInstallmentPayment(
      appRef, appData, method, data.reference, data.amount ? data.amount / 100 : null
    );
    console.log('✅ Payment recorded. installmentsPaid:', installmentsPaid);
    console.log('✅ previousInstallmentsPaid:', previousInstallmentsPaid);
    
    if (previousInstallmentsPaid === 0 && installmentsPaid >= 1) {
      console.log('📧 FIRST PAYMENT! Provisioning student account...');
      try {
        await provisionStudentAccount(appRef.id, appData);
        console.log('✅ Student account provisioned and email sent!');
      } catch (err) {
        console.error('❌ provisionStudentAccount failed:', err.message);
        console.error('❌ Full error:', err);
        // Don't fail the webhook – payment is already recorded
      }
    } else {
      console.log('ℹ️ Not first payment or already provisioned');
    }
  } catch (err) {
    console.error('❌ recordInstallmentPayment failed:', err.message);
    console.error('❌ Full error:', err);
    return { statusCode: 500, body: 'Internal error' };
  }
  
  console.log('✅ WEBHOOK COMPLETED SUCCESSFULLY');
  return { statusCode: 200, body: 'OK' };
};