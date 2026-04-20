import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getMessaging, isSupported, type Messaging } from "firebase/messaging";

const requiredEnv = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_APP_ID",
] as const;

function readConfig() {
  const env = import.meta.env;
  for (const key of requiredEnv) {
    if (!env[key]) {
      throw new Error(
        `Missing ${key}. Copy .env.example to .env.local and fill in the Firebase config.`,
      );
    }
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

function connectEmulators(auth: Auth, db: Firestore): void {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}

export const app: FirebaseApp = initializeApp(readConfig());
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectEmulators(auth, db);
}

let messagingPromise: Promise<Messaging | null> | null = null;

/**
 * FCM is browser-only and requires service-worker support. Returns null in
 * unsupported environments (Vitest jsdom, Safari without PWA install, etc.)
 * so callers can show a graceful fallback rather than crash on import.
 */
export function getMessagingIfSupported(): Promise<Messaging | null> {
  if (messagingPromise) return messagingPromise;
  messagingPromise = isSupported().then((ok) => (ok ? getMessaging(app) : null));
  return messagingPromise;
}
