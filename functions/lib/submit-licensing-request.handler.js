/**
 * Public licensing REQUEST (interest form on /licensing)
 * Does not issue a licence — staff review in admin.
 * Looks up email against students + applications for context.
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
  const address = String(body.address || '').trim();
  const nin = String(body.nin || '').replace(/\D/g, '');
  const isCgtiaStudent = body.isCgtiaStudent === true || body.isCgtiaStudent === 'yes' || body.isCgtiaStudent === 'true';
  const regNumber = String(body.regNumber || '').trim();
  const trainingBackground = String(body.trainingBackground || '').trim();
  const message = String(body.message || '').trim();
  const hasIdUpload = !!body.hasIdUpload;
  const idFileName = String(body.idFileName || '').trim();

  if (!fullName || !email || !phone) return bad(400, 'Name, email and phone are required');
  if (!address) return bad(400, 'Address is required');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(400, 'Invalid email');
  if (nin && nin.length !== 11) return bad(400, 'NIN must be 11 digits if provided');
  if (!hasIdUpload && !nin) return bad(400, 'Provide a government ID upload or an 11-digit NIN');

  let matchedStudent = null;
  let matchedApplication = null;
  try {
    const sq = await db.collection('students').where('email', '==', email).limit(1).get();
    if (!sq.empty) {
      const d = sq.docs[0].data() || {};
      matchedStudent = {
        id: sq.docs[0].id,
        name: d.fullLegalName || d.fullName || '',
        regNumber: d.regNumber || ''
      };
    }
  } catch (e) { /* ignore lookup errors */ }
  try {
    const aq = await db.collection('applications').where('email', '==', email).limit(1).get();
    if (!aq.empty) {
      const d = aq.docs[0].data() || {};
      matchedApplication = {
        id: aq.docs[0].id,
        name: d.fullName || '',
        program: d.program || ''
      };
    }
  } catch (e) { /* ignore */ }

  // If they claim to be a student but email is not on file, still accept but flag
  const studentClaimMismatch = isCgtiaStudent && !matchedStudent;

  const id = email.replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36);

  try {
    await db.collection('licensingRequests').doc(id).set({
      fullName,
      email,
      phone,
      address,
      nin: nin || '',
      hasIdUpload,
      idFileName: idFileName || '',
      isCgtiaStudent: !!isCgtiaStudent || !!matchedStudent,
      regNumber: regNumber || (matchedStudent && matchedStudent.regNumber) || '',
      trainingBackground,
      message,
      matchedStudentId: matchedStudent ? matchedStudent.id : null,
      matchedStudentName: matchedStudent ? matchedStudent.name : null,
      matchedApplicationId: matchedApplication ? matchedApplication.id : null,
      studentClaimMismatch: !!studentClaimMismatch,
      status: 'new',
      source: 'licensing-page',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success: true,
        id,
        matchedStudent: !!matchedStudent,
        matchedApplication: !!matchedApplication,
        studentClaimMismatch: !!studentClaimMismatch
      })
    };
  } catch (err) {
    console.error(err);
    return bad(500, 'Could not submit request');
  }
};
