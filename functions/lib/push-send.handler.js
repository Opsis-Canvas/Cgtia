/**
 * Sends a push to admin devices. Only a signed-in admin (email listed in PUSH_ADMIN_EMAILS) can send.
 * Uses the service account in FIREBASE_SERVICE_ACCOUNT_B64 to call Firebase Cloud Messaging.
 */
import { db } from './firebaseAdmin.js';
const API_KEY = 'AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0';
const PROJECT = 'verify-cgtia-cert';
const J = (code, obj) => ({ statusCode: code, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(obj) });
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));

function serviceAccount() {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  if (!b64) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is not set');
  return JSON.parse(atob(b64));
}
async function accessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const head = enc({ alg: 'RS256', typ: 'JWT' });
  const claim = enc({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/firebase.messaging', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 });
  const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim));
  const jwt = head + '.' + claim + '.' + b64u(sig);
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
  });
  const d = await r.json();
  if (!d.access_token) throw new Error('Could not sign in to Firebase messaging');
  return d.access_token;
}
async function emailOf(idToken) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken })
  });
  const d = await r.json();
  return d.users && d.users[0] ? String(d.users[0].email || '').toLowerCase() : '';
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return J(204, {});
  if (event.httpMethod !== 'POST') return J(405, { error: 'Method Not Allowed' });
  let body = {};
  try { body = JSON.parse(event.body || '{}'); } catch (e) { return J(400, { error: 'Bad request' }); }
  const email = body.idToken ? await emailOf(String(body.idToken)) : '';
  const allowed = String(process.env.PUSH_ADMIN_EMAILS || '').toLowerCase().split(',').map((x) => x.trim()).filter(Boolean);
  if (!email || !allowed.includes(email)) return J(403, { error: 'Not allowed to send notifications.' });

  const title = String(body.title || 'CGTIA').slice(0, 80);
  const text = String(body.body || '').slice(0, 240);
  const url = String(body.url || '/').slice(0, 300);
  const snap = await db.collection('pushTokens').get();
  const tokens = [];
  snap.forEach((d) => { const v = d.data() || {}; if (v.token && (!body.audience || v.role === body.audience)) tokens.push(v.token); });
  if (!tokens.length) return J(200, { sent: 0, failed: 0 });

  const sa = serviceAccount();
  const at = await accessToken(sa);
  let sent = 0, failed = 0;
  for (const t of tokens) {
    // data-only, so the worker shows exactly one alert per device
    const r = await fetch('https://fcm.googleapis.com/v1/projects/' + PROJECT + '/messages:send', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + at },
      body: JSON.stringify({ message: { token: t, data: { title, body: text, url } } })
    });
    if (r.ok) sent++; else failed++;
  }
  return J(200, { sent, failed });
};
