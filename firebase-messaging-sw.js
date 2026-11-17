// Firebase Cloud Messaging service worker. It must sit at the root of the site.
// Shows an alert even when the site is closed. Messages are data-only, so only this file shows them.
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js");
firebase.initializeApp({
  apiKey: "AIzaSyCZOA3OxPyRyRT9XUTsFTUWKViFmkpfOV0",
  authDomain: "verify-cgtia-cert.firebaseapp.com",
  projectId: "verify-cgtia-cert",
  storageBucket: "verify-cgtia-cert.firebasestorage.app",
  messagingSenderId: "766655761701",
  appId: "1:766655761701:web:d59853909358bf3b9b5ecc"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  self.registration.showNotification(d.title || "CGTIA", { body: d.body || "", icon: "/assets/images/push/icon-512.png", badge: "/assets/images/push/badge-96.png", data: { url: d.url || "/" } });
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil(self.clients.openWindow(url));
});
