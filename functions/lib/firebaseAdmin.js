/**
 * Drop-in replacement for the firebase-admin Firestore subset used by the CGTIA functions,
 * built on Firestore's REST API + WebCrypto so it runs on Cloudflare Pages Functions
 * (firebase-admin / gRPC does NOT work on Workers).
 *
 * Needs ONE env var in Cloudflare (Pages -> Settings -> Variables and Secrets):
 *   FIREBASE_SERVICE_ACCOUNT_B64  (base64 of the service-account JSON, same as Netlify)
 *
 * Supported: collection().doc().get/set(merge)/update, collection().add(),
 * where(field,'==',v).limit(n).get(), FieldValue.serverTimestamp(), Timestamp.
 * NOT supported: admin.auth() (see bottom) — only needed by provisioning / confirm-transfer.
 */

class Timestamp {
  constructor(seconds, nanos = 0) { this._seconds = seconds; this._nanoseconds = nanos; }
  toDate() { return new Date(this._seconds * 1000 + Math.floor(this._nanoseconds / 1e6)); }
  toMillis() { return this.toDate().getTime(); }
  static fromDate(d) { return new Timestamp(Math.floor(d.getTime() / 1000), (d.getTime() % 1000) * 1e6); }
  static now() { return Timestamp.fromDate(new Date()); }
}
const SERVER_TS = { __serverTimestamp: true };
const FieldValue = { serverTimestamp: () => SERVER_TS };

/* ---------- credentials / token ---------- */
let _sa = null, _key = null, _tok = null, _tokExp = 0;

function getSA() {
  if (_sa) return _sa;
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_B64;
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  let txt = null;
  if (b64) txt = atob(b64.replace(/\s+/g, ''));
  else if (raw) txt = raw;
  if (!txt) throw new Error('FIREBASE_SERVICE_ACCOUNT_B64 is not set in Cloudflare environment variables');
  _sa = JSON.parse(txt);
  if (!_sa.private_key || !_sa.client_email || !_sa.project_id) throw new Error('Service account JSON is missing fields');
  return _sa;
}

const b64url = (buf) => {
  let s = ''; const b = new Uint8Array(buf);
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const b64urlStr = (str) => b64url(new TextEncoder().encode(str));

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  if (_tok && now < _tokExp - 60) return _tok;
  const sa = getSA();
  if (!_key) {
    const pem = sa.private_key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
    _key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  }
  const head = b64urlStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64urlStr(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  }));
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', _key, new TextEncoder().encode(head + '.' + claim));
  const jwt = head + '.' + claim + '.' + b64url(sig);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + encodeURIComponent(jwt)
  });
  const j = await res.json();
  if (!res.ok || !j.access_token) throw new Error('Google token error: ' + (j.error_description || j.error || res.status));
  _tok = j.access_token; _tokExp = now + (j.expires_in || 3600);
  return _tok;
}

async function api(path, body) {
  const sa = getSA();
  const base = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents`;
  const res = await fetch(path.startsWith('http') ? path : base + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + (await getToken()), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  if (res.status === 404 && !body) return null;
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error('Firestore ' + res.status + ': ' + ((j.error && j.error.message) || 'request failed'));
  return j;
}

/* ---------- value encode / decode ---------- */
const isPlain = (v) => v && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;

function enc(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (v instanceof Timestamp) return { timestampValue: new Date(v.toMillis()).toISOString() };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string') return { stringValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  if (isPlain(v)) return { mapValue: { fields: encFields(v) } };
  return { stringValue: String(v) };
}
function encFields(o) {
  const f = {};
  for (const k of Object.keys(o)) { if (o[k] !== undefined && o[k] !== SERVER_TS) f[k] = enc(o[k]); }
  return f;
}
function dec(v) {
  if (!v) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) { const d = new Date(v.timestampValue); return Timestamp.fromDate(d); }
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return decFields(v.mapValue.fields || {});
  if ('referenceValue' in v) return v.referenceValue;
  if ('geoPointValue' in v) return v.geoPointValue;
  if ('bytesValue' in v) return v.bytesValue;
  return null;
}
function decFields(f) { const o = {}; for (const k of Object.keys(f || {})) o[k] = dec(f[k]); return o; }

const seg = (s) => (/^[A-Za-z_][A-Za-z0-9_]*$/.test(s) ? s : '`' + s.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`');

// flatten nested plain objects into field paths (so merge/update behave like the Admin SDK)
function flatten(obj, prefix, paths, fields, transforms, splitKeys) {
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (v === undefined) continue;
    const parts = (prefix || []).concat(splitKeys ? k.split('.') : [k]);
    const p = parts.map(seg).join('.');
    if (v === SERVER_TS) { transforms.push({ fieldPath: p, setToServerValue: 'REQUEST_TIME' }); continue; }
    if (isPlain(v) && Object.keys(v).length) { flatten(v, parts, paths, fields, transforms, false); continue; }
    paths.push(p);
    let cur = fields;
    for (let i = 0; i < parts.length - 1; i++) {
      cur[parts[i]] = cur[parts[i]] || { mapValue: { fields: {} } };
      cur = cur[parts[i]].mapValue.fields;
    }
    cur[parts[parts.length - 1]] = enc(v);
  }
}

/* ---------- refs ---------- */
class DocSnap {
  constructor(id, raw) { this.id = id; this._raw = raw; this.exists = !!raw; }
  data() { return this._raw ? decFields(this._raw.fields) : undefined; }
}

class DocRef {
  constructor(col, id) { this.col = col; this.id = id; }
  get path() { return this.col + '/' + this.id; }
  get _name() { const sa = getSA(); return `projects/${sa.project_id}/databases/(default)/documents/${this.col}/${this.id}`; }
  async get() {
    const raw = await api('/' + this.col + '/' + encodeURIComponent(this.id));
    return new DocSnap(this.id, raw);
  }
  async _commit(update, exists) {
    const w = { update };
    if (exists === true) w.currentDocument = { exists: true };
    await api('https://firestore.googleapis.com/v1/projects/' + getSA().project_id + '/databases/(default)/documents:commit', { writes: [w] });
  }
  async set(data, opts) {
    const paths = [], fields = {}, transforms = [];
    if (opts && opts.merge) {
      flatten(data, [], paths, fields, transforms, false);
      const w = { update: { name: this._name, fields }, updateMask: { fieldPaths: paths } };
      if (transforms.length) w.updateTransforms = transforms;
      await api('https://firestore.googleapis.com/v1/projects/' + getSA().project_id + '/databases/(default)/documents:commit', { writes: [w] });
    } else {
      const f = {};
      for (const k of Object.keys(data)) { if (data[k] === SERVER_TS) transforms.push({ fieldPath: seg(k), setToServerValue: 'REQUEST_TIME' }); else if (data[k] !== undefined) f[k] = enc(data[k]); }
      const w = { update: { name: this._name, fields: f } };
      if (transforms.length) w.updateTransforms = transforms;
      await api('https://firestore.googleapis.com/v1/projects/' + getSA().project_id + '/databases/(default)/documents:commit', { writes: [w] });
    }
  }
  async update(data) {
    const paths = [], fields = {}, transforms = [];
    flatten(data, [], paths, fields, transforms, true);
    const w = { update: { name: this._name, fields }, updateMask: { fieldPaths: paths }, currentDocument: { exists: true } };
    if (transforms.length) w.updateTransforms = transforms;
    await api('https://firestore.googleapis.com/v1/projects/' + getSA().project_id + '/databases/(default)/documents:commit', { writes: [w] });
  }
}

class Query {
  constructor(col, filters = [], lim = null) { this.col = col; this.filters = filters; this.lim = lim; }
  where(field, op, value) {
    if (op !== '==') throw new Error('Only == filters are supported in the REST adapter');
    return new Query(this.col, this.filters.concat([{ field, value }]), this.lim);
  }
  limit(n) { return new Query(this.col, this.filters, n); }
  async get() {
    const sq = { from: [{ collectionId: this.col }] };
    const fs = this.filters.map((f) => ({ fieldFilter: { field: { fieldPath: f.field.split('.').map(seg).join('.') }, op: 'EQUAL', value: enc(f.value) } }));
    if (fs.length === 1) sq.where = fs[0];
    else if (fs.length > 1) sq.where = { compositeFilter: { op: 'AND', filters: fs } };
    if (this.lim) sq.limit = this.lim;
    const rows = await api(':runQuery', { structuredQuery: sq });
    const docs = (rows || []).filter((r) => r.document).map((r) => new DocSnap(r.document.name.split('/').pop(), r.document));
    return { docs, empty: docs.length === 0, size: docs.length, forEach: (fn) => docs.forEach(fn) };
  }
}

class CollectionRef extends Query {
  constructor(col) { super(col); }
  doc(id) { return new DocRef(this.col, id); }
  async add(data) {
    const id = Array.from(crypto.getRandomValues(new Uint8Array(15))).map((b) => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[b % 62]).join('');
    const ref = new DocRef(this.col, id);
    await ref.set(data);
    return ref;
  }
}

const db = { collection: (name) => new CollectionRef(name) };

// admin.auth() is not available over REST here. Only provisioning.js / confirm-transfer.js use it.
const authStub = () => { throw new Error('admin.auth() is not supported on Cloudflare yet'); };
const admin = { firestore: Object.assign(() => db, { FieldValue, Timestamp }), auth: authStub };

export { admin, db };
