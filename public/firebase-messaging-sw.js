// Firebase Cloud Messaging service worker. Registered explicitly by the app
// at /firebase-messaging-sw.js so the SDK can route background pushes here.
// This is the only service worker the app ships -- it doubles as the PWA
// install signal (browsers count any registered SW).
//
// Config below is the steward-dev project's public web config. Production
// builds need this file regenerated against the prod project (open task on
// the launch checklist).

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
    icon: "/icon.svg",
    badge: "/icon.svg",
    data: payload.data ?? {},
  });
});

// PWA installability hint: a SW with at least an empty fetch listener counts
// toward the install criteria in some browsers. We pass through to the
// network without caching -- the app is online-only in v1.
self.addEventListener("fetch", () => {
  // Intentionally empty: let the browser handle the request normally.
});
