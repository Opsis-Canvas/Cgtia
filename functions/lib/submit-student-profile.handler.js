/**
 * Student legal profile intake — requires valid, unexpired, unused invite token.
 * Path on client: /field-check/confirm?token=...
 */
const { db, admin } = require('./firebaseAdmin');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

function bad(status, error) {
  return { statusCode: status, headers: CORS, body: JSON.stringify({ error }) };
}

function slugEmail(email) {
  return String(email).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Reg number — not sequential/obvious.
 * Shape: CGTIA/YYYY/COHORT/RANDOM  e.g. CGTIA/2026/A/k7Xm2p
 * Cohort from invite.program or body.cohort (A–D); default A.
 * Uniqueness: retry if collision.
 */
function cohortLetter(raw) {
  const s = String(raw || "").trim().toUpperCase();
  if (/^[A-D]$/.test(s)) return s;
  // map program names loosely
  if (s.includes("HIGHER")) return "C";
  if (s.includes("DIPLOMA") && !s.includes("HIGHER")) return "B";
  if (s.includes("LICEN")) return "D";
  if (s.includes("CERT")) return "A";
  return "A";
}

function randomRegSuffix(len) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

/**
 * Reg number: YY/CG/######  (year + CG + 6 digits, not sequential from 000001)
 * Cohort A–D is stored separately on the student record, not in the reg number.
 * Uniqueness checked before assign.
 */
function randomDigits(n) {
  let s = "";
  for (let i = 0; i < n; i++) s += Math.floor(Math.random() * 10);
  return s;
}

async function nextRegNumber(yearHint) {
  const y = yearHint && String(yearHint).length >= 2
    ? String(yearHint).slice(-2)
    : String(new Date().getFullYear()).slice(-2);
  for (let attempt = 0; attempt < 20; attempt++) {
    const candidate = `${y}/CG/${randomDigits(6)}`;
    const q = await db.collection("students").where("regNumber", "==", candidate).limit(1).get();
    if (q.empty) return candidate;
  }
  return `${y}/CG/${randomDigits(4)}${Date.now().toString().slice(-4)}`;
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' };
  }
  if (event.httpMethod !== 'POST') return bad(405, 'Method Not Allowed');

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return bad(400, 'Invalid JSON');
  }

  const token = String(body.token || '').trim();
  if (!token) return bad(403, 'Invite token required. Open the link sent by the academy.');

  // Validate invite
  const invRef = db.collection('studentInvites').doc(token);
  let inv;
  try {
    const invSnap = await invRef.get();
    if (!invSnap.exists) return bad(403, 'This invite link is invalid.');
    inv = invSnap.data() || {};
    if (inv.used) return bad(403, 'This invite link has already been used.');
    const exp = inv.expiresAt;
    let expiresMs = null;
    if (exp && typeof exp.toDate === 'function') expiresMs = exp.toDate().getTime();
    else if (exp && exp._seconds) expiresMs = exp._seconds * 1000;
    else if (exp) expiresMs = new Date(exp).getTime();
    if (expiresMs && Date.now() > expiresMs) {
      return bad(403, 'This invite link has expired. Ask the academy for a new link.');
    }
  } catch (err) {
    console.error(err);
    return bad(500, 'Could not validate invite.');
  }

  const fullLegalName = String(body.fullLegalName || '').trim();
  const nin = String(body.nin || '').replace(/\D/g, '');
  const dateOfBirth = String(body.dateOfBirth || '').trim();
  let email = String(body.email || inv.email || '').trim().toLowerCase();
  const phone = String(body.phone || '').trim();
  const nextOfKinName = String(body.nextOfKinName || '').trim();
  const nextOfKinPhone = String(body.nextOfKinPhone || '').trim();
  const nextOfKinRelation = String(body.nextOfKinRelation || '').trim();

  if (!fullLegalName || !email || !dateOfBirth || !phone) {
    return bad(400, 'Missing required identity or contact fields');
  }
  if (nin.length !== 11) return bad(400, 'NIN must be 11 digits');
  if (!nextOfKinName || !nextOfKinPhone || !nextOfKinRelation) {
    return bad(400, 'Next of kin details required');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad(400, 'Invalid email');

  // If invite locked an email, force it
  if (inv.email && inv.email.toLowerCase() !== email) {
    return bad(400, 'Use the email address this invite was issued for: ' + inv.email);
  }

  const id = slugEmail(email);

  // Reject if this email already completed a profile (no double submit)
  try {
    const existing = await db.collection('students').doc(id).get();
    if (existing.exists && existing.data().profileCompleted) {
      return bad(409, 'A student profile already exists for this email. Contact the academy if you need a correction.');
    }
    // Also block same NIN twice
    const ninQ = await db.collection('students').where('nin', '==', nin).limit(1).get();
    if (!ninQ.empty) {
      const other = ninQ.docs[0];
      if (other.id !== id) {
        return bad(409, 'This NIN is already registered to another student.');
      }
    }
  } catch (err) {
    console.error('dup check', err);
  }

  let regNumber;
  try {
    regNumber = await nextRegNumber(body.year || inv.year || new Date().getFullYear());
  } catch (err) {
    console.error('regNumber', err);
    regNumber = `${String(new Date().getFullYear()).slice(-2)}/CG/${Date.now().toString().slice(-6)}`;
  }

  const payload = {
    fullName: fullLegalName,
    fullLegalName,
    nin,
    dateOfBirth,
    email,
    phone,
    nextOfKin: { name: nextOfKinName, phone: nextOfKinPhone, relation: nextOfKinRelation },
    nextOfKinName,
    nextOfKinPhone,
    nextOfKinRelation,
    regNumber,
    program: inv.program || body.program || '',
    profileCompleted: true,
    profileCompletedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    source: 'field-check-confirm',
    inviteToken: token
  };

  try {
    const ref = db.collection('students').doc(id);
    const existing = await ref.get();
    if (!existing.exists) {
      payload.createdAt = admin.firestore.FieldValue.serverTimestamp();
      payload.status = 'active';
    } else if (!existing.data().regNumber) {
      payload.regNumber = regNumber;
    } else {
      // keep existing reg number on update path (shouldn't complete twice)
      delete payload.regNumber;
    }
    await ref.set(payload, { merge: true });

    // Mark invite used (one-time)
    await invRef.set({
      used: true,
      usedAt: admin.firestore.FieldValue.serverTimestamp(),
      usedByEmail: email,
      studentId: id,
      regNumber: payload.regNumber || regNumber
    }, { merge: true });

    // Mirror onto application if exists
    try {
      const appRef = db.collection('applications').doc(email);
      if ((await appRef.get()).exists) {
        await appRef.set({
          fullLegalName, nin, dateOfBirth, nextOfKinName, nextOfKinPhone, nextOfKinRelation,
          regNumber: payload.regNumber || regNumber,
          profileCompleted: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      }
    } catch (e) {
      console.warn('application mirror', e.message);
    }

    return {
      statusCode: 200,
      headers: CORS,
      body: JSON.stringify({
        success: true,
        id,
        regNumber: payload.regNumber || regNumber
      })
    };
  } catch (err) {
    console.error('submit-student-profile', err);
    return bad(500, 'Could not save profile. Contact the academy if this continues.');
  }
};
