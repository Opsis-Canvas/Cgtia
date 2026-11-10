/** Records a tab switch or a leave of full screen during an attempt. Returns whether the limit has been passed. */
import { db } from './firebaseAdmin.js';
import { json, CORS } from './exam-public.js';

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS, body: '' };
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Invalid request.' }); }
  const id = String(body.sessionId || '').trim();
  const type = ['fullscreen', 'capture', 'camera'].indexOf(body.type) >= 0 ? body.type : 'tab';
  if (!id) return json(400, { error: 'Missing session.' });
  try {
    const ref = db.collection('examSessions').doc(id);
    const snap = await ref.get();
    if (!snap.exists) return json(404, { error: 'Session not found.' });
    const s = snap.data() || {};
    if (s.status !== 'in_progress') return json(200, { locked: true, tabSwitches: s.tabSwitches || 0 });
    // A screenshot attempt is treated like leaving the screen: it counts toward the limit
    const tabSwitches = (type === 'tab' || type === 'capture') ? (s.tabSwitches || 0) + 1 : (s.tabSwitches || 0);
    const captureAttempts = type === 'capture' ? (s.captureAttempts || 0) + 1 : (s.captureAttempts || 0);
    const cameraOffs = type === 'camera' ? (s.cameraOffs || 0) + 1 : (s.cameraOffs || 0);
    const fullscreenExits = type === 'fullscreen' ? (s.fullscreenExits || 0) + 1 : (s.fullscreenExits || 0);
    await ref.update({ tabSwitches, fullscreenExits, captureAttempts, cameraOffs });
    const allowed = Number(s.allowed) || 0;
    return json(200, { tabSwitches, allowed, locked: tabSwitches > allowed });
  } catch (err) {
    console.error('exam-event', err);
    return json(500, { error: 'Could not record this.' });
  }
};
