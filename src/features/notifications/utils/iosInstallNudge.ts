/**
 * Web Push on iOS Safari only works inside a PWA installed to the home screen
 * (Safari 16.4+). When we detect Mobile Safari running outside a PWA, the
 * subscribe prompt is replaced with an "Add to Home Screen" nudge.
 *
 * Pure inputs so it's testable without touching navigator.
 */

export interface NudgeContext {
  userAgent: string;
  /** True when the page was launched from the home-screen icon. */
  isStandalone: boolean;
}

export function isIosSafari(ua: string): boolean {
  const isIosLike = /iPad|iPhone|iPod/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return isIosLike && isSafari;
}

export function shouldShowIosNudge(ctx: NudgeContext): boolean {
  if (!isIosSafari(ctx.userAgent)) return false;
  return !ctx.isStandalone;
}

/**
 * Reads the runtime context from `navigator` + `matchMedia`. Returns `null`
 * during SSR / vitest jsdom (no window).
 */
export function readBrowserContext(): NudgeContext | null {
  if (typeof window === "undefined") return null;
  const standalone =
    window.matchMedia?.("(display-mode: standalone)").matches ||
    // Safari-specific
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    userAgent: navigator.userAgent,
    isStandalone: Boolean(standalone),
  };
}
