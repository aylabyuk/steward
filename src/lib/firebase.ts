import { initializeApp, type FirebaseApp } from "firebase/app";
import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from "firebase/app-check";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions, type Functions } from "firebase/functions";
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

// Resolve the emulator host from `window.location.hostname` so the
// SDK reaches the emulators on whatever interface the page was
// loaded over: `127.0.0.1` from desktop localhost, the Mac's LAN IP
// (e.g. `192.168.2.24`) when testing from a phone on the same WiFi.
// Pair with `firebase.json`'s `"host": "0.0.0.0"` so the emulators
// actually listen on the LAN interface.
function emulatorHost(): string {
  if (typeof window === "undefined") return "127.0.0.1";
  return window.location.hostname || "127.0.0.1";
}

function connectEmulators(auth: Auth, db: Firestore, functions: Functions): void {
  const host = emulatorHost();
  connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
  connectFirestoreEmulator(db, host, 8080);
  connectFunctionsEmulator(functions, host, 5001);
}

export const app: FirebaseApp = initializeApp(readConfig());
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const functions: Functions = getFunctions(app);

// Second named Firebase app for the public speaker-invitation page.
// Firebase persists auth state per app name, so speaker sign-in here
// never touches the bishopric Google session on the main app (and
// vice versa). Keeps the two surfaces — main bishopric PWA and
// speaker invite landing — from stepping on each other's currentUser.
export const inviteApp: FirebaseApp = initializeApp(readConfig(), "invite");
export const inviteAuth: Auth = getAuth(inviteApp);
export const inviteDb: Firestore = getFirestore(inviteApp);
export const inviteFunctions: Functions = getFunctions(inviteApp);

if (import.meta.env.VITE_USE_EMULATORS === "true") {
  connectEmulators(auth, db, functions);
  connectEmulators(inviteAuth, inviteDb, inviteFunctions);
}

/** App Check initialization — gated on env var so dev/emulator and
 *  any environment without a configured reCAPTCHA Enterprise key
 *  continues to work unchanged. Once the operator provisions the key
 *  in the Firebase Console and sets `VITE_FIREBASE_APPCHECK_SITE_KEY`
 *  on Vercel, both Firebase apps (main + invite) start attaching App
 *  Check tokens to all callable / Firestore / FCM requests, blocking
 *  abuse from non-app sources at the edge. The server-side enforcement
 *  knob lives on the callable itself (`APP_CHECK_ENFORCED`). */
const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY as string | undefined;
let appCheck: AppCheck | undefined;
let inviteAppCheck: AppCheck | undefined;
if (appCheckSiteKey && import.meta.env.VITE_USE_EMULATORS !== "true") {
  appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
  inviteAppCheck = initializeAppCheck(inviteApp, {
    provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
    isTokenAutoRefreshEnabled: true,
  });
}
export { appCheck, inviteAppCheck };

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
