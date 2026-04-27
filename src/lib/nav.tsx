import { type ComponentProps, type MouseEvent, forwardRef, useCallback } from "react";
import {
  Link as RRLink,
  type NavigateFunction,
  type To,
  useNavigate as useRRNavigate,
} from "react-router";

type LinkProps = ComponentProps<typeof RRLink>;

type Direction = "forward" | "back" | "replace" | "none";

function setDirection(dir: Direction): void {
  document.documentElement.dataset.navDirection = dir;
}

function isModifiedClick(e: MouseEvent<HTMLAnchorElement>): boolean {
  return e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;
}

// Schedule is the base of the stack. Any navigation TO it — link click,
// programmatic navigate, or the "/" → "/schedule" router redirect — is a
// dismissal: the top page slides off to the right and Schedule is
// revealed underneath.
function isBasePath(pathname: string | undefined): boolean {
  return pathname === "/" || pathname === "/schedule";
}

function getPathname(to: To): string | undefined {
  if (typeof to === "string") return to.split("?")[0]?.split("#")[0];
  return to.pathname;
}

function pickDirection(to: To, replace: boolean | undefined): Direction {
  if (replace) return "replace";
  if (isBasePath(getPathname(to))) return "back";
  return "forward";
}

// Native-stack transitions are mobile-only. On desktop we skip the
// `startViewTransition` call entirely — instant route swap, no
// snapshot/composite overhead. Breakpoint matches `useIsMobile` and
// the matching media query in styles/index.css.
function shouldTransition(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(max-width: 767.98px)").matches;
}

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { to, onClick, replace, viewTransition, ...rest },
  ref,
) {
  return (
    <RRLink
      ref={ref}
      to={to}
      replace={replace}
      viewTransition={viewTransition ?? shouldTransition()}
      onClick={(e) => {
        if (!e.defaultPrevented && !isModifiedClick(e) && shouldTransition()) {
          setDirection(pickDirection(to, replace));
        }
        onClick?.(e);
      }}
      {...rest}
    />
  );
});

export function useNavigate(): NavigateFunction {
  const nav = useRRNavigate();
  return useCallback<NavigateFunction>(
    ((to: unknown, opts?: { replace?: boolean; viewTransition?: boolean }) => {
      if (typeof to === "number") {
        // Browser back/forward delta — popstate listener handles direction.
        return nav(to);
      }
      const transition = shouldTransition();
      if (transition) setDirection(pickDirection(to as To, opts?.replace));
      return nav(to as Parameters<NavigateFunction>[0], {
        viewTransition: transition,
        ...opts,
      });
    }) as NavigateFunction,
    [nav],
  );
}
