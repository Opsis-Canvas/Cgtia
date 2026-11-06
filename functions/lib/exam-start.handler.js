/** Starts one attempt: records the start time, sets the deadline, and shuffles the questions if the exam says so. */
import { db } from './firebaseAdmin.js';
import { json, CORS, examFromLink, publicExam, settingsOf } from './exam-public.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const name = String(body.name || '').trim().slice(0, 120);
  if (name.length < 2) return json(400, { error: 'Enter your full name to begin.' });
  try {
    const r = await examFromLink(String(body.token || '').trim());
    if (r.error) return json(403, { error: r.error });
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
      status: 'in_progress', tabSwitches: 0, fullscreenExits: 0,
      allowed: pub.settings.tabSwitchAllowed, timerMinutes: pub.timerMinutes
    });
    await db.collection('examLinks').doc(r.token).update({ uses: (r.link.uses || 0) + 1 });
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
