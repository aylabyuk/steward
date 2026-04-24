/**
 * Registers the Firebase Cloud Messaging service worker on app boot. This
 * doubles as the PWA install signal (browsers require a registered SW for
 * the install prompt). Subscribe + push handling happens in
 * `features/notifications/fcmToken.ts`.
 *
 * No-op on the server / in tests where `navigator` isn't available.
 */

// Scope Firebase's web SDK uses when nothing passes `serviceWorkerRegistration`
// to getToken()/deleteToken(). Historical Steward builds (pre-v0.9.3) let this
// get registered by accident, and browsers keep it alive indefinitely. A fresh
// token minted against our primary scope-"/" registration can then get
// invalidated when the ghost's presence triggers FCM's "newer subscription
// supersedes older" logic — the symptom tracked in issue #106.
const GHOST_SCOPE_SUFFIX = "/firebase-cloud-messaging-push-scope";

async function unregisterGhostScopeRegistration(): Promise<void> {
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      if (reg.scope.endsWith(GHOST_SCOPE_SUFFIX)) {
        const ok = await reg.unregister();
        // Surface the event so a clean-slate test can tell us whether the ghost
        // is a one-time persistent leftover (never logs again) or actively
        // recreated (logs every reload). Left as console.info — a real logger
        // doesn't pay its way for a one-shot migration step.
        console.info(`[steward] unregistered leftover FCM push-scope SW (${reg.scope}) → ${ok}`);
      }
    }
  } catch (err) {
    console.warn("[steward] ghost FCM SW cleanup failed", err);
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
          await navigator.serviceWorker.register("/firebase-messaging-sw.js");
        } catch (err) {
          console.error("FCM service worker registration failed", err);
        }
      })();
    },
    { once: true },
  );
}
