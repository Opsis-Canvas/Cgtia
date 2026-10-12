/**
 * One-time licensing packet (documents + notes) after staff invite.
 * Payment can be handled separately / later via Paystack on same flow.
 */
const { db, admin } = require('./firebaseAdmin');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
function bad(s, e) { return { statusCode: s, headers: CORS, body: JSON.stringify({ error: e }) }; }

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return bad(405, 'Method Not Allowed');
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return bad(400, 'Invalid JSON'); }

  const token = String(body.token || '').trim();
  if (!token) return bad(403, 'Invite token required');

  const invRef = db.collection('licensingInvites').doc(token);
  const invSnap = await invRef.get();
  if (!invSnap.exists) return bad(403, 'Invalid invite');
  const inv = invSnap.data() || {};
  if (inv.used) return bad(403, 'Invite already used');
  let exp = inv.expiresAt;
  let ms = null;
  if (exp && exp.toDate) ms = exp.toDate().getTime();
  else if (exp && exp._seconds) ms = exp._seconds * 1000;
  else if (exp) ms = new Date(exp).getTime();
  if (ms && Date.now() > ms) return bad(403, 'Invite expired');

  const fullName = String(body.fullName || inv.fullName || '').trim();
  const email = String(body.email || inv.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const nin = String(body.nin || '').replace(/\D/g, '');
  const trainingBackground = String(body.trainingBackground || '').trim();
  const firstAidCert = String(body.firstAidCert || '').trim();
  const clinicalHours = String(body.clinicalHours || '').trim();
  const documentLinks = String(body.documentLinks || '').trim(); // user pastes Drive/links for now
  const notes = String(body.notes || '').trim();

  if (!fullName || !email) return bad(400, 'Name and email required');
  if (nin && nin.length !== 11) return bad(400, 'NIN must be 11 digits if provided');

  const id = email.replace(/[^a-z0-9]+/g, '-') + '-pkt-' + Date.now().toString(36);
  try {
    await db.collection('licensingPackets').doc(id).set({
      inviteToken: token,
      fullName, email, phone, nin,
      trainingBackground, firstAidCert, clinicalHours,
      documentLinks, notes,
      isCgtiaStudent: !!inv.isCgtiaStudent,
      status: 'submitted',
      paymentStatus: 'unpaid',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    await invRef.set({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      packetId: id
    }, { merge: true });
    return { statusCode: 200, headers: CORS, body: JSON.stringify({ success: true, id }) };
  } catch (err) {
    console.error(err);
    return bad(500, 'Could not save packet');
  }
};
