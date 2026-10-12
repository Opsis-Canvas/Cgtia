/**
 * --------------------------------------------------------
 * File:        firebase.service.js
 * Purpose:     Lazy Firebase init for applications lookup/save
 * --------------------------------------------------------
 */

const firebaseConfig = {
  apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
  authDomain: "verify-cgtia-cert.firebaseapp.com",
  projectId: "verify-cgtia-cert",
  storageBucket: "verify-cgtia-cert.firebasestorage.app",
  messagingSenderId: "766655761701",
  appId: "1:766655761701:web:45f559e0e38023439b5ecc",
  measurementId: "G-KEWZNLWNLW"
};

let _ready = null;

export async function getFirebase() {
  if (_ready) return _ready;
  _ready = (async () => {
    const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
    const {
      getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs
    } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const api = { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs };
    window.__cgtiaFirestore = db;
    window.__cgtiaFirestoreApi = api;
    return { db, api };
  })();
  return _ready;
}

export function makeResumeToken() {
  const arr = new Uint8Array(16);
  if (crypto && crypto.getRandomValues) crypto.getRandomValues(arr);
  else for (let i = 0; i < 16; i++) arr[i] = Math.floor(Math.random() * 256);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Lookup application by email (doc id = normalized email) */
export async function findApplicationByEmail(email) {
  const normalized = String(email || "").trim().toLowerCase();
  if (!normalized) return null;
  try {
    const { db, api } = await getFirebase();
    const snap = await api.getDoc(api.doc(db, "applications", normalized));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() };
  } catch (e) {
    console.warn("findApplicationByEmail", e);
    return null;
  }
}

/** Lookup by resume token */
export async function findApplicationByToken(token) {
  if (!token) return null;
  try {
    const { db, api } = await getFirebase();
    const q = api.query(api.collection(db, "applications"), api.where("resumeToken", "==", token));
    const snap = await api.getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return { id: d.id, ...d.data() };
  } catch (e) {
    console.warn("findApplicationByToken", e);
    return null;
  }
}

export async function saveApplication(app) {
  const { db, api } = await getFirebase();
  const id = String(app.email).trim().toLowerCase();
  const ref = api.doc(db, "applications", id);

  // CREATE payload must match Firestore rules hasOnly([...]) exactly.
  // resumeToken is optional — try with it, then without if rules not merged yet.
  const baseCreate = {
    fullName: app.fullName || "",
    phone: app.phone || "",
    email: id,
    program: app.program || "",
    startDate: app.startDate || "",
    message: app.message || "",
    status: "pending",
    paymentStatus: "unpaid",
    paymentPlan: "full",
    installmentsTotal: 1,
    installmentsPaid: 0,
    createdAt: api.serverTimestamp(),
    updatedAt: api.serverTimestamp()
  };

  try {
    const existing = await api.getDoc(ref);
    if (existing.exists()) {
      // Update path is restricted; only touch allowed fields when unpaid
      const patch = {
        updatedAt: api.serverTimestamp()
      };
      if (app.resumeToken) patch.resumeToken = app.resumeToken;
      if (app.paymentPlan === "installment" || app.paymentPlan === "full") {
        patch.paymentPlan = app.paymentPlan;
        patch.installmentsTotal = app.paymentPlan === "installment" ? 3 : 1;
      }
      try {
        await api.setDoc(ref, patch, { merge: true });
      } catch (e) {
        console.warn("application update limited by rules:", e.message || e);
      }
      return id;
    }
  } catch (e) {
    // getDoc may fail for public (read denied) — treat as new create
    console.warn("application read skipped:", e.message || e);
  }

  // New application create
  const withToken = Object.assign({}, baseCreate, app.resumeToken ? { resumeToken: app.resumeToken } : {});
  try {
    await api.setDoc(ref, withToken);
    console.log("[cgtia] application created", id);
    return id;
  } catch (e1) {
    console.warn("create with resumeToken failed, retrying without:", e1.message || e1);
    try {
      await api.setDoc(ref, baseCreate);
      console.log("[cgtia] application created (no resumeToken)", id);
      return id;
    } catch (e2) {
      console.error("[cgtia] application create FAILED:", e2);
      throw e2;
    }
  }
}

export async function markApplicationPaid(email, reference) {
  try {
    const { db, api } = await getFirebase();
    const id = String(email).trim().toLowerCase();
    await api.updateDoc(api.doc(db, "applications", id), {
      paymentStatus: "paid",
      status: "paid",
      paymentReference: reference || "",
      paidAt: api.serverTimestamp(),
      updatedAt: api.serverTimestamp()
    });
  } catch (e) {
    console.warn("markApplicationPaid", e);
  }
}


/** First active promotion that applies to a program key (or any if programs empty) */
export async function getActivePromotion(programKey) {
  try {
    const { db, api } = await getFirebase();
    const snap = await api.getDocs(api.collection(db, "promotions"));
    let found = null;
    snap.forEach((d) => {
      const data = d.data();
      if (!data.active) return;
      const programs = data.programs || [];
      if (!programs.length || programs.includes(programKey) || programs.includes("all")) {
        found = { id: d.id, ...data };
      }
    });
    return found;
  } catch (e) {
    console.warn("getActivePromotion", e);
    return null;
  }
}

export async function getProgramPricing(programKey) {
  try {
    const { db, api } = await getFirebase();
    const snap = await api.getDoc(api.doc(db, "programs", programKey));
    if (snap.exists()) return { id: snap.id, ...snap.data() };
  } catch (e) {}
  return null;
}
