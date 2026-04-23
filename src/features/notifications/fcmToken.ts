import {
  arrayRemove,
  arrayUnion,
  doc,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { deleteToken, getToken } from "firebase/messaging";
import { db, getMessagingIfSupported } from "@/lib/firebase";
import { deriveDeviceName } from "./deriveDeviceName";

const SW_PATH = "/firebase-messaging-sw.js";

/** localStorage key for "the FCM token subscribed on THIS browser/PWA".
 *  Read on mount by the Profile page to flag the matching fcmTokens[]
 *  row with a "This device" chip. Scoping by localStorage (per-origin
 *  per-browser) avoids the SW/permission timing issues we hit when
 *  re-deriving via getToken — see commit history on #53. */
const CURRENT_TOKEN_KEY = "steward:fcmToken:current";

function rememberCurrentToken(token: string): void {
  try {
    localStorage.setItem(CURRENT_TOKEN_KEY, token);
  } catch {
    /* private-mode or disabled storage — chip won't light up, not fatal */
  }
}

function forgetCurrentToken(): void {
  try {
    localStorage.removeItem(CURRENT_TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function readCurrentDeviceToken(): string | null {
  try {
    return localStorage.getItem(CURRENT_TOKEN_KEY);
  } catch {
    return null;
  }
}

export interface SubscribeResult {
  token: string;
  platform: "web" | "ios" | "android";
  name: string;
}

function detectPlatform(): "web" | "ios" | "android" {
  if (typeof navigator === "undefined") return "web";
  if (/iPad|iPhone|iPod/.test(navigator.userAgent)) return "ios";
  if (/Android/.test(navigator.userAgent)) return "android";
  return "web";
}

async function registerSw(): Promise<ServiceWorkerRegistration> {
  if (!("serviceWorker" in navigator)) {
    throw new Error("This browser does not support push notifications.");
  }
  // Reuse an existing registration if one is already active under this scope.
  const existing = await navigator.serviceWorker.getRegistration(SW_PATH);
  return existing ?? navigator.serviceWorker.register(SW_PATH);
}

/**
 * Asks for permission, fetches an FCM token for this device, and persists
 * it to the caller's member doc. Returns null when the browser denies
 * permission or FCM isn't supported (the caller renders a fallback).
 */
export async function subscribeDevice(input: {
  wardId: string;
  uid: string;
}): Promise<SubscribeResult | null> {
  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) throw new Error("VITE_FIREBASE_VAPID_KEY is not configured.");

  const messaging = await getMessagingIfSupported();
  if (!messaging) return null;

  if (Notification.permission === "default") {
    const granted = await Notification.requestPermission();
    if (granted !== "granted") return null;
  } else if (Notification.permission !== "granted") {
    return null;
  }

  const swReg = await registerSw();
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swReg });
  if (!token) return null;

  const platform = detectPlatform();
  const name = deriveDeviceName(navigator as unknown as Parameters<typeof deriveDeviceName>[0]);
  // serverTimestamp() can't ride inside arrayUnion (Firestore rejects sentinel
  // values nested in arrays), so we stamp client-side. The doc-level
  // updatedAt below is still server-authoritative.
  await updateDoc(doc(db, "wards", input.wardId, "members", input.uid), {
    fcmTokens: arrayUnion({ token, platform, name, updatedAt: Timestamp.now() }),
    updatedAt: serverTimestamp(),
  });
  rememberCurrentToken(token);
  return { token, platform, name };
}

export async function unsubscribeDevice(input: {
  wardId: string;
  uid: string;
  token: { token: string; platform: "web" | "ios" | "android"; updatedAt: unknown };
}): Promise<void> {
  const messaging = await getMessagingIfSupported();
  if (messaging) {
    try {
      await deleteToken(messaging);
    } catch {
      // The token may already be invalid; we still want to drop it from Firestore.
    }
  }
  await updateDoc(doc(db, "wards", input.wardId, "members", input.uid), {
    fcmTokens: arrayRemove(input.token),
    updatedAt: serverTimestamp(),
  });
  if (readCurrentDeviceToken() === input.token.token) forgetCurrentToken();
}
