/**
 * Marks an attempt, saves the result and tells the admin. The score is only sent back
 * to the visitor when the exam's result setting is "instant".
 */
import { db, admin } from './firebaseAdmin.js';
import { json, CORS, examFromLink, settingsOf } from './exam-public.js';
import { emailAdmin } from './admin-alert.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const id = String(body.sessionId || '').trim();
  const reason = ['manual', 'timer', 'tab-limit', 'fullscreen'].indexOf(body.reason) >= 0 ? body.reason : 'manual';
  if (!id) return json(400, { error: 'Missing session.' });
  try {
    const ref = db.collection('examSessions').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return json(404, { error: 'Session not found.' });
    const s = snap.data() || {};
    if (s.status !== 'in_progress') return json(200, { ok: true, received: true, alreadySent: true });
    const ex = await examFromLink(s.token);
    const exam = ex.exam || (await db.collection('assessments').doc(s.examId).get()).data() || {};
    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    const chosen = body.answers && typeof body.answers === 'object' ? body.answers : {};
    let score = 0;
    let answered = 0;
    questions.forEach((q, i) => {
      const a = chosen[i];
      if (a !== undefined && a !== null && a !== '') answered += 1;
      if (q.correct != null && String(a) === String(q.correct)) score += 1;
    });
    const total = questions.length || 1;
    const pct = Math.round((score / total) * 100);
    const settings = settingsOf(exam);
    const submittedAt = new Date().toISOString();
    await db.collection('examSubmissions').doc(id).set({
      sessionId: id, examId: s.examId, examTitle: s.examTitle || exam.title || '', name: s.name || '',
      score, total, pct, answered, reason, tabSwitches: s.tabSwitches || 0, fullscreenExits: s.fullscreenExits || 0,
      allowed: s.allowed || 0, submittedAt, resultMode: settings.resultMode
    });
    await ref.update({ status: 'submitted', submittedAt, reason });
    await db.collection('adminAlerts').add({
      kind: 'exam', read: false, createdAt: admin.firestore.FieldValue.serverTimestamp(),
      title: 'Exam submitted: ' + (s.examTitle || 'Exam'),
      body: (s.name || 'Visitor') + ' · ' + pct + '% · left the tab ' + (s.tabSwitches || 0) + ' time(s) · ' + reason
    });
    await emailAdmin('Exam submitted: ' + (s.examTitle || 'Exam'), ['Name: ' + (s.name || ''), 'Score: ' + pct + '% (' + score + ' of ' + total + ')', 'Left the screen: ' + (s.tabSwitches || 0) + ' time(s), allowed ' + (s.allowed || 0), 'Ended by: ' + reason, 'Submitted: ' + submittedAt]);
    if (settings.resultMode === 'instant') return json(200, { ok: true, score, total, pct });
    return json(200, { ok: true, received: true });
  } catch (err) {
    console.error('exam-submit', err);
    return json(500, { error: 'Could not send your answers. Try again.' });
  }
};
