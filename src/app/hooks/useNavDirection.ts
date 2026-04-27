import { useEffect } from "react";
import { useLocation } from "react-router";

const RESET_DELAY_MS = 400;

/** Tracks navigation direction on `<html data-nav-direction>` so CSS
 *  view-transition rules can pick the right animation (slide in,
 *  slide out, fade, none).
 *
 *  - Forward / replace are set synchronously by the wrapped `<Link>`
 *    + `useNavigate` in `@/lib/nav` on click / call.
 *  - Back is set here on every `popstate` event (browser back/forward
 *    button, iOS swipe-back).
 *  - After each navigation the attribute resets to `"none"` so a
 *    subsequent first-paint or `<Navigate replace>` redirect doesn't
 *    inherit a stale direction.
 *
 *  Mount once, near the root of the in-shell tree (AppShell). */
export function useNavDirection(): void {
  const location = useLocation();

  useEffect(() => {
    const onPopState = () => {
      document.documentElement.dataset.navDirection = "back";
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  useEffect(() => {
    // Wait long enough for the View Transition's animations to play
    // out (260ms slide / 140ms fade) before resetting. Resetting
    // mid-flight would re-evaluate the pseudo-element selectors and
    // can drop the running animation.
    const id = window.setTimeout(() => {
      document.documentElement.dataset.navDirection = "none";
    }, RESET_DELAY_MS);
    return () => window.clearTimeout(id);
  }, [location.key]);
}
