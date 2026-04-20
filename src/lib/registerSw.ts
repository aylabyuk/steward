/**
 * Registers the Firebase Cloud Messaging service worker on app boot. This
 * doubles as the PWA install signal (browsers require a registered SW for
 * the install prompt). Subscribe + push handling happens in
 * `features/notifications/fcmToken.ts`.
 *
 * No-op on the server / in tests where `navigator` isn't available.
 */
export function registerFcmServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  // Defer past first paint so we don't block hydration.
  window.addEventListener(
    "load",
    () => {
      navigator.serviceWorker.register("/firebase-messaging-sw.js").catch((err) => {
        console.error("FCM service worker registration failed", err);
      });
    },
    { once: true },
  );
}
