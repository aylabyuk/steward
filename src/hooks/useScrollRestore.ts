import { useEffect } from "react";

/** Restore the scroll position of a route across navigations within
 *  a session. On mount, jumps the page back to the value last saved
 *  under `key`; on unmount, captures the current scroll for next
 *  time. Persists in `sessionStorage` so a full reload also keeps
 *  the position (within the same tab session).
 *
 *  Picks the right scroll source automatically: AppShell's inner
 *  scroll container on desktop (marked with `data-app-scroll`),
 *  falling back to the window when no container is present (mobile,
 *  or modal pages with their own layout).
 *
 *  Pass `{ enabled: false }` to fully no-op (no restore, no save) —
 *  used by routes that drive scroll themselves on mount (e.g.
 *  schedule's `?focus=<date>` flash) so the saved position isn't
 *  poisoned by the deliberate scroll. */
export function useScrollRestore(key: string, options?: { enabled?: boolean }): void {
  const enabled = options?.enabled ?? true;
  useEffect(() => {
    if (!enabled) return;
    const storageKey = `scroll-restore:${key}`;
    const saved = sessionStorage.getItem(storageKey);
    const target = pickScrollTarget();

    if (saved !== null) {
      const y = Number.parseInt(saved, 10);
      if (Number.isFinite(y) && y > 0) {
        // Defer to the next frame so any layout/data the page mounts
        // with has settled. Jumping pre-paint to a position past the
        // current document height is a no-op.
        requestAnimationFrame(() => setScroll(target, y));
      }
    }

    return () => {
      sessionStorage.setItem(storageKey, String(getScroll(target)));
    };
  }, [key, enabled]);
}

type Target = HTMLElement | Window;

function pickScrollTarget(): Target {
  const el = document.querySelector<HTMLElement>("[data-app-scroll]");
  if (el && el.scrollHeight > el.clientHeight) return el;
  return window;
}

function getScroll(target: Target): number {
  if (target === window) return window.scrollY;
  return (target as HTMLElement).scrollTop;
}

function setScroll(target: Target, y: number): void {
  if (target === window) {
    window.scrollTo({ top: y, behavior: "instant" as ScrollBehavior });
    return;
  }
  (target as HTMLElement).scrollTop = y;
}
