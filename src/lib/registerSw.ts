/**
 * Registers the Firebase Cloud Messaging service worker on app boot and
 * primes the Firebase messaging singleton's `swRegistration` slot so the
 * SDK never auto-registers a ghost SW at
 * `/firebase-cloud-messaging-push-scope`. See issue #106 for the chase.
 *
 * Priming happens SYNCHRONOUSLY at module-import time, not deferred. A
 * React effect that fires a Firebase callable (e.g. `TwilioAutoConnect`)
 * mounts in the same tick as hydration, which is earlier than the browser
 * `load` event. Without a synchronous prime, Firebase's
 * `getMessagingToken()` auto-registers the ghost before we can stop it.
 *
 * We use a stub object (not a real ServiceWorkerRegistration) for the
 * sync prime because the real registration only arrives after the async
 * `navigator.serviceWorker.register()` call resolves. The stub satisfies
 * the only guard that matters — `Tke(messaging, undefined)`'s
 * `!e.swRegistration` check — and Firebase's
 * Functions-callable path is tolerant of downstream errors when the
 * stub's `pushManager` doesn't exist (`getMessagingToken()` returns
 * undefined on throw). Our own `subscribeDevice` explicitly passes a
 * real SW registration to `getToken`, which replaces the stub via
 * `Tke`'s `e.swRegistration = t` branch.
 *
 * No-op on the server / in tests where `navigator` isn't available.
 */

import { getMessaging } from "firebase/messaging";
import { app } from "./firebase";

const GHOST_SCOPE_SUFFIX = "/firebase-cloud-messaging-push-scope";
const SW_PATH = "/firebase-messaging-sw.js";

interface MessagingInternal {
  swRegistration?: ServiceWorkerRegistration | { scope: string; __stewardStub: true };
}

function primeStub(): void {
  try {
    const messaging = getMessaging(app) as unknown as MessagingInternal;
    if (!messaging.swRegistration) {
      messaging.swRegistration = { scope: "/", __stewardStub: true };
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
