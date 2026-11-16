// Portal push: after a student signs in, their device is registered for their own alerts only.
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getMessaging, getToken, isSupported } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging.js";
import { getFirestore, collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const CONFIG = {
  apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
  authDomain: "verify-cgtia-cert.firebaseapp.com",
  projectId: "verify-cgtia-cert",
  storageBucket: "verify-cgtia-cert.firebasestorage.app",
  messagingSenderId: "766655761701",
  appId: "1:766655761701:web:d59853909358bf3b9b5ecc"
};
const VAPID_KEY = "BATnwABh6N0bK4wWNF-gzr1IEqgrA6x5IMFoTHYCtoSrhbU3MZzDTJey06uNqjALgcfAEY7PzK-RcYMxNfRrLZQ";

export async function setupPortalPush(email) {
  if (!email || !("Notification" in window) || !(await isSupported())) return;
  const app = getApps()[0] || initializeApp(CONFIG);
  const db = getFirestore(app);
  const addr = email.toLowerCase().trim();
  const snap = await getDocs(query(collection(db, "students"), where("email", "==", addr)));
  let studentId = "";
  snap.forEach((d) => { if (!studentId && d.data().trashed !== true) studentId = d.id; });
  if (!studentId) return;
  if (Notification.permission === "granted") return register(app, db, studentId, addr);
  if (Notification.permission === "default") offer(async () => {
    const p = await Notification.requestPermission();
    if (p === "granted") await register(app, db, studentId, addr);
  });
}

async function register(app, db, studentId, email) {
  const reg = await navigator.serviceWorker.register("/firebase-messaging-sw.js");
  const token = await getToken(getMessaging(app), { vapidKey: VAPID_KEY, serviceWorkerRegistration: reg });
  if (!token) return;
  await setDoc(doc(db, "pushTokens", token), { token, role: "student", studentId, email, createdAt: serverTimestamp() }, { merge: true });
}

// A small, dismissible prompt so the student can choose to turn on alerts
function offer(onYes) {
  if (document.getElementById("cgtia-push-offer")) return;
  const box = document.createElement("div");
  box.id = "cgtia-push-offer";
  box.style.cssText = "position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;background:#0f126c;color:#fff;border-radius:18px;padding:14px 16px;display:flex;align-items:center;gap:10px;font:600 14px Inter,system-ui,sans-serif;box-shadow:0 18px 36px -18px rgba(15,18,108,.7)";
  box.innerHTML = '<span style="flex:1">Turn on alerts for results, payments and messages?</span>' +
    '<button id="cgtia-push-yes" style="background:#fff;color:#0f126c;border:0;border-radius:999px;padding:8px 14px;font-weight:800">Turn on</button>' +
    '<button id="cgtia-push-no" style="background:transparent;color:#fff;border:0;padding:8px">Later</button>';
  document.body.appendChild(box);
  document.getElementById("cgtia-push-yes").onclick = async () => { box.remove(); try { await onYes(); } catch (e) {} };
  document.getElementById("cgtia-push-no").onclick = () => box.remove();
}
