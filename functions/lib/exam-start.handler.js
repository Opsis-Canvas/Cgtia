/** Starts one attempt: records the start time, sets the deadline, and shuffles the questions if the exam says so. */
import { db, admin } from './firebaseAdmin.js';
import { json, CORS, examFromLink, publicExam, settingsOf, deviceState, findAllowed } from './exam-public.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const name = String(body.name || '').trim().slice(0, 120);
  const email = String(body.email || '').trim().slice(0, 160);
  const regNumber = String(body.regNumber || '').trim().slice(0, 40);
  if (body.consent !== true) return json(400, { error: 'Please read and agree to the notice before you begin.' });
  const photo = typeof body.photo === 'string' && body.photo.indexOf('data:image/jpeg;base64,') === 0 && body.photo.length < 90000 ? body.photo : '';
  const cameraOn = body.cameraOn === true;
  const deviceId = String(body.deviceId || '').slice(0, 80);
  if (deviceId.length < 8) return json(400, { error: 'This device could not be recognised. Reload the page and try again.' });
  if (name.length < 2) return json(400, { error: 'Enter your full name to begin.' });
  try {
    const r = await examFromLink(String(body.token || '').trim());
    if (r.error) return json(403, { error: r.error });
    const prior = await deviceState(r.token, deviceId);
    if (prior && prior.state === 'completed') return json(403, { error: 'You have already completed this exam. Thank you.', device: prior });
    if (prior && prior.state === 'started') return json(403, { error: 'You already started this exam on this device. Contact the academy if you need help.', device: prior });
    const list = Array.isArray(r.link.allowed) ? r.link.allowed : [];
    let placeIndex = -1;
    if (list.length) {
      if (!email && !regNumber) return json(400, { error: 'Enter your email or your registration number.' });
      placeIndex = findAllowed(list, name, email, regNumber);
      if (placeIndex < 0) return json(403, { error: 'Your name or email is not on the list for this exam. Check it matches exactly, or contact the academy.' });
      if (list[placeIndex].used) return json(403, { error: 'This place has already been used.' });
    }
    if (settingsOf(r.exam).requireCamera && !cameraOn) return json(400, { error: 'This exam needs your camera and microphone. Allow them and try again.' });
    const pub = publicExam(r.exam);
    const n = pub.questions.length;
    if (!n) return json(400, { error: 'This exam has no questions yet.' });
    const order = pub.questions.map((q) => q.i);
    if (pub.settings.shuffle) {
      for (let k = order.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [order[k], order[j]] = [order[j], order[k]]; }
    }
    const startedAt = new Date();
    const deadline = pub.timerMinutes > 0 ? new Date(startedAt.getTime() + pub.timerMinutes * 60000).toISOString() : null;
    const id = 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    await db.collection('examSessions').doc(id).set({
      token: r.token, examId: r.examId, examTitle: pub.title, name,
      startedAt: startedAt.toISOString(), deadline, order,
      status: 'in_progress', tabSwitches: 0, fullscreenExits: 0, captureAttempts: 0, cameraOffs: 0, deviceId, email, regNumber,
      photo, cameraOn, consentAt: new Date().toISOString(),
      allowed: pub.settings.tabSwitchAllowed, timerMinutes: pub.timerMinutes
    });
    await db.collection('adminAlerts').add({
      kind: 'exam-started', read: false, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      title: 'Exam started: ' + pub.title,
      body: name + (email ? ' · ' + email : '') + ' · started just now'
    });
    if (placeIndex >= 0) {
      const next = list.map((pl, i) => (i === placeIndex ? { ...pl, used: true, usedAt: new Date().toISOString() } : pl));
      await db.collection('examLinks').doc(r.token).update({ allowed: next, uses: (r.link.uses || 0) + 1 });
    } else {
      await db.collection('examLinks').doc(r.token).update({ uses: (r.link.uses || 0) + 1 });
    }
    const byIndex = {};
    pub.questions.forEach((q) => { byIndex[q.i] = q; });
    return json(200, {
      ok: true, sessionId: id, deadline, timerMinutes: pub.timerMinutes, settings: settingsOf(r.exam),
      title: pub.title,
      questions: order.map((i) => byIndex[i])
    });
  } catch (err) {
    console.error('exam-start', err);
    return json(500, { error: 'Could not start the exam. Try again.' });
  }
};
