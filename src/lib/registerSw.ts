/**
 * Registers the Firebase Cloud Messaging service worker on app boot and
 * primes the Firebase messaging singleton with our SW registration and
 * VAPID key so the SDK never (a) auto-registers a ghost SW at
 * `/firebase-cloud-messaging-push-scope` nor (b) mints a stand-in token
 * against the Firebase default VAPID key. See issue #106 for the chase.
 *
 * Priming happens SYNCHRONOUSLY at module-import time, not deferred. A
 * React effect that fires a Firebase callable (e.g. `TwilioAutoConnect`)
 * mounts in the same tick as hydration, which is earlier than the browser
 * `load` event. Without a synchronous prime, Firebase's
 * `getMessagingToken()` — invoked for every Functions callable — runs
 * through its token lifecycle against a freshly-constructed messaging
 * singleton whose `swRegistration` and `vapidKey` slots are both unset,
 * defaulting the VAPID to Firebase's built-in sample key and
 * auto-registering the ghost SW.
 *
 * For `swRegistration`, we use a stub object (not a real
 * ServiceWorkerRegistration) because the real registration only arrives
 * after the async `navigator.serviceWorker.register()` call resolves.
 * The stub satisfies the only guard that matters in
 * `Tke(messaging, undefined)` (the `!e.swRegistration` check) and
 * Firebase's callable path tolerates the downstream error when the
 * stub's `pushManager` doesn't exist — `getMessagingToken()` wraps
 * `messaging.getToken()` in a try/catch and returns undefined on throw,
 * causing the callable to proceed without the optional
 * `Firebase-Instance-ID-Token` header.
 *
 * For `vapidKey`, we prime it with ours (`VITE_FIREBASE_VAPID_KEY`) so
 * that when Firebase's internal token lookup eventually runs
 * `mke(messaging)` against a real subscription, its
 * `bke(stored.subscriptionOptions, current.subscriptionOptions)`
 * equality check passes. Without this, any post-subscribe callable
 * invocation would see a VAPID mismatch vs the IDB-stored token, call
 * `hee()` to delete that token from FCM, and mint a new one with the
 * default key — leaving the Firestore-stored token dangling and
 * triggering `messaging/registration-token-not-registered` on the
 * next server-side push.
 *
 * Our own `subscribeDevice` explicitly passes a real SW registration
 * and the same VAPID key to `getToken`, which `Tke`/`Cke` then treat
 * as idempotent assignments.
 *
 * No-op on the server / in tests where `navigator` isn't available.
 */

import { getMessaging } from "firebase/messaging";
import { app } from "./firebase";

const GHOST_SCOPE_SUFFIX = "/firebase-cloud-messaging-push-scope";
const SW_PATH = "/firebase-messaging-sw.js";

interface MessagingInternal {
  swRegistration?: ServiceWorkerRegistration | { scope: string; __stewardStub: true };
  vapidKey?: string;
}

function primeStub(): void {
  try {
    const messaging = getMessaging(app) as unknown as MessagingInternal;
    if (!messaging.swRegistration) {
      messaging.swRegistration = { scope: "/", __stewardStub: true };
    }
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (vapidKey && !messaging.vapidKey) {
      messaging.vapidKey = vapidKey;
    }
  } catch {
    // jsdom / unsupported environments — not actionable.
  }
}

async function swapStubForRealRegistration(swReg: ServiceWorkerRegistration): Promise<void> {
  try {
    const messaging = getMessaging(app) as unknown as MessagingInternal;
    const existing = messaging.swRegistration;
    // Only replace our own stub; preserve anything Firebase already set.
    if (!existing || (existing as { __stewardStub?: true }).__stewardStub) {
      messaging.swRegistration = swReg;
    }
  } catch {
    /* see primeStub */
  }
}

async function unregisterGhostScopeRegistration(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      if (reg.scope.endsWith(GHOST_SCOPE_SUFFIX)) {
        const ok = await reg.unregister();
        console.info(`[steward] unregistered leftover FCM push-scope SW (${reg.scope}) → ${ok}`);
      }
    }
  } catch (err) {
    console.warn("[steward] ghost FCM SW cleanup failed", err);
  }
}

export function registerFcmServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

  // SYNC prime: beats any React effect that fires a Firebase callable in
  // the same tick as hydration.
  primeStub();

  // The actual SW registration + real-swReg swap can still wait for
  // `load` — it's cosmetic past the sync prime (ghost is already blocked
  // from that moment onward).
  window.addEventListener(
    "load",
    () => {
      void (async () => {
        await unregisterGhostScopeRegistration();
        try {
          const swReg = await navigator.serviceWorker.register(SW_PATH);
          await swapStubForRealRegistration(swReg);
        } catch (err) {
          console.error("FCM service worker registration failed", err);
        }
      })();
    },
    { once: true },
  );
}
