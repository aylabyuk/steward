import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useUserMenuStore } from "@/stores/userMenuStore";
import { cn } from "@/lib/cn";
import { UserMenuContent } from "./UserMenuContent";

const EXIT_MS = 250;

/** Mobile-only side drawer that hosts the user menu content. Renders
 *  as a sibling to the AppShell content (portaled to body) so it can
 *  float above the page-push transform without being clipped by it.
 *  Slides in from the right; on dismissal, slides back out and stays
 *  mounted through the exit animation. The actual page-push effect
 *  (translating the content area left to reveal the drawer + leave a
 *  small page peek) lives in AppShell so the transform applies to the
 *  outer wrapper. */
export function UserSideDrawer() {
  const open = useUserMenuStore((s) => s.open);
  const close = useUserMenuStore((s) => s.close);

  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
      return;
    }
    if (!mounted) return;
    setExiting(true);
    const t = setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      close();
    };
    document.addEventListener("keydown", onEsc, true);
    return () => document.removeEventListener("keydown", onEsc, true);
  }, [open, close]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        aria-label="Close menu"
        onClick={close}
        className={cn(
          "fixed inset-y-0 left-0 w-[15vw] z-50 bg-transparent",
          exiting
            ? "animate-[fadeOut_200ms_ease-in_forwards]"
            : "animate-[fade_200ms_ease-out_backwards]",
        )}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="User menu"
        className={cn(
          "fixed inset-y-0 right-0 w-[85vw] z-50 bg-chalk shadow-elev-3 flex flex-col overflow-y-auto pt-[env(safe-area-inset-top)] pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          exiting
            ? "animate-[drawerSlideOutRight_250ms_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[drawerSlideInRight_280ms_cubic-bezier(0.22,1,0.36,1)_backwards]",
        )}
      >
        <UserMenuContent onClose={close} />
      </aside>
    </>,
    document.body,
  );
}
