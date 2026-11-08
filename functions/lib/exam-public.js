/**
 * Shared helpers for examination links.
 * An exam is an assessment with type "exam". Its questions and settings live in the assessments collection.
 * A link (examLinks) points at one exam. A session (examSessions) is one person's attempt.
 */
import { db } from './firebaseAdmin.js';

export const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
export function json(status, body) {
  return { statusCode: status, headers: { ...CORS, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export const DEFAULT_SETTINGS = {
  oneAttempt: true,
  shuffle: true,
  requireFullscreen: true,
  tabSwitchAllowed: 1,
  resultMode: 'instant',
  autoSubmit: true
};

export function settingsOf(exam) {
  const s = (exam && exam.examSettings) || {};
  return {
    oneAttempt: s.oneAttempt !== false,
    shuffle: s.shuffle !== false,
    requireFullscreen: s.requireFullscreen !== false,
    tabSwitchAllowed: Math.max(0, Math.min(10, Number(s.tabSwitchAllowed == null ? 1 : s.tabSwitchAllowed) || 0)),
    resultMode: s.resultMode === 'admin' ? 'admin' : 'instant',
    autoSubmit: s.autoSubmit !== false
  };
}

// Checks the link and returns the exam, or the reason it can't be used
export async function examFromLink(token) {
  if (!token || token.length < 8) return { error: 'This link is not valid.' };
  const snap = await db.collection('examLinks').doc(token).get();
  if (!snap.exists) return { error: 'This link is not valid.' };
  const l = snap.data() || {};
  if (l.revoked) return { error: 'This link has been cancelled.' };
  const exp = l.expiresAt ? new Date(l.expiresAt).getTime() : 0;
  if (exp && Date.now() > exp) return { error: 'This link has expired.' };
  if (l.maxUses > 0 && (l.uses || 0) >= l.maxUses) return { error: 'This link has already been used.' };
  const ex = await db.collection('assessments').doc(l.examId).get();
  if (!ex.exists) return { error: 'This exam is not available.' };
  const exam = ex.data() || {};
  if (exam.active === false || exam.hibernated === true) return { error: 'This exam is not open at the moment.' };
  return { link: l, token, exam, examId: l.examId };
}

// What the visitor may see: no correct answers
export function publicExam(exam) {
  const settings = settingsOf(exam);
  return {
    title: String(exam.title || 'Exam').slice(0, 160),
    description: String(exam.description || '').slice(0, 2000),
    timerMinutes: Number(exam.timerMinutes) || 0,
    settings,
    questions: (Array.isArray(exam.questions) ? exam.questions : []).map((q, i) => ({
      i,
      prompt: String(q.prompt || '').slice(0, 1000),
      options: (Array.isArray(q.options) ? q.options : []).slice(0, 8).map((o) => String(o).slice(0, 300))
    }))
  };
}

// Has this device already taken (or started) this exam link? Returns null, or { state, pct, score, total }
export async function deviceState(token, deviceId) {
  if (!deviceId || deviceId.length < 8) return null;
  const subs = await db.collection('examSubmissions').where('deviceId', '==', deviceId).limit(100).get();
  let hit = null;
  subs.forEach((d) => { const x = d.data() || {}; if (x.token === token) hit = { state: 'completed', pct: x.pct, score: x.score, total: x.total, resultMode: x.resultMode || 'instant' }; });
  if (hit) return hit;
  const live = await db.collection('examSessions').where('deviceId', '==', deviceId).limit(100).get();
  live.forEach((d) => { const x = d.data() || {}; if (x.token === token && x.status === 'in_progress') hit = { state: 'started' }; });
  return hit;
}
