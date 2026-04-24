/**
 * Registers the Firebase Cloud Messaging service worker on app boot. This
 * doubles as the PWA install signal (browsers require a registered SW for
 * the install prompt). Subscribe + push handling happens in
 * `features/notifications/fcmToken.ts`.
 *
 * Also primes the Firebase messaging singleton's `swRegistration` to point
 * at our scope-"/" registration so Firebase's internal
 * `registerDefaultSw` never fires — see issue #106 for the chase. Without
 * this, the first callable function invocation (e.g.
 * `callIssueSpeakerSession` from `TwilioAutoConnect`) triggers
 * `Functions.contextProvider.getContext()` →
 * `this.messaging.getToken()` (no args), which calls the SDK's internal
 * `Tke(messaging, undefined)` → `registerDefaultSw(messaging)` and lands
 * a ghost SW at scope `/firebase-cloud-messaging-push-scope`. That ghost
 * then contends with our real registration and FCM invalidates the
 * primary push subscription (observed as
 * `messaging/registration-token-not-registered` after 2–4 sends).
 *
 * No-op on the server / in tests where `navigator` isn't available.
 */

import { getMessaging } from "firebase/messaging";
import { app } from "./firebase";

const GHOST_SCOPE_SUFFIX = "/firebase-cloud-messaging-push-scope";
const SW_PATH = "/firebase-messaging-sw.js";

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

/** Seed the Firebase messaging singleton with our SW registration so its
 *  internal `updateSwReg(messaging, undefined)` path (reachable via
 *  `Functions.contextProvider.getMessagingToken()`) skips
 *  `registerDefaultSw` and never creates a registration at
 *  `/firebase-cloud-messaging-push-scope`.
 *
 *  Direct assignment is the cheapest way to set the property without
 *  triggering `getToken()`'s permission prompt — we explicitly don't
 *  want to prompt on boot. `swRegistration` is a non-public field on
 *  the `MessagingService` class, so we cast; the property has existed
 *  since messaging was introduced and is what all internal paths read
 *  and write. */
async function primeMessagingSwRegistration(swReg: ServiceWorkerRegistration): Promise<void> {
  try {
    // getMessaging is safe to call on boot — it just constructs the
    // service object; nothing is sent over the network and no SW is
    // registered as a side effect.
    const messaging = getMessaging(app) as unknown as {
      swRegistration?: ServiceWorkerRegistration;
    };
    messaging.swRegistration = swReg;
  } catch (err) {
    // Environments without messaging support (jsdom, some mobile
    // browsers) throw from getMessaging. Swallow — downstream code
    // already degrades via getMessagingIfSupported().
    console.warn("[steward] prime messaging.swRegistration skipped", err);
  }
}

export function registerFcmServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Defer past first paint so we don't block hydration.
  window.addEventListener(
    "load",
    () => {
      void (async () => {
        await unregisterGhostScopeRegistration();
        try {
          const swReg = await navigator.serviceWorker.register(SW_PATH);
          await primeMessagingSwRegistration(swReg);
        } catch (err) {
          console.error("FCM service worker registration failed", err);
        }
      })();
    },
    { once: true },
  );
}
