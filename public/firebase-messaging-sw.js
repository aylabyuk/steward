// Firebase Cloud Messaging service worker. Registered explicitly by the app
// at /firebase-messaging-sw.js so the SDK can route background pushes here.
//
// Config below is the steward-dev project's public web config (same values
// the CI workflow ships in plain text). Production builds need this file
// regenerated against the prod project; Phase 14 (PWA polish) handles that.
//
// Coexistence with the PWA service worker (vite-plugin-pwa, lands in Phase
// 14): both SWs claim distinct scopes -- this one is registered explicitly
// here, the PWA SW is registered automatically by the plugin. Do not register
// this file twice.

importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBeBECZlT1Rye3GL-usPr4KsdCHNumJyEE",
  authDomain: "steward-dev-5e4dc.firebaseapp.com",
  projectId: "steward-dev-5e4dc",
  storageBucket: "steward-dev-5e4dc.firebasestorage.app",
  messagingSenderId: "159630054981",
  appId: "1:159630054981:web:b95053f12fcfa9e7ea752c",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title ?? "Steward";
  const body = payload.notification?.body ?? "";
  self.registration.showNotification(title, {
    body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    data: payload.data ?? {},
  });
});
