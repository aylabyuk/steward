import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

const EXIT_MS = 200;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional small-caps eyebrow shown above the children. Mirrors the
   *  inline label that desktop popovers carry (e.g. "Sunday type"). */
  title?: string;
  children: ReactNode;
}

/** Phone-only bottom sheet. Mirrors the SpeakerChatFloatingDrawer
 *  pattern (full-width, slides up, grab handle, body-scroll lock,
 *  backdrop dismiss, ESC to close) but at content-height instead of
 *  85dvh — appropriate for short option lists like "horizon select"
 *  or "Sunday actions".
 *
 *  Portals to `document.body` so `position: fixed` always anchors to
 *  the viewport, regardless of whether an ancestor has `transform`,
 *  `filter`, `backdrop-filter`, etc. (any of which would re-root a
 *  fixed descendant against that ancestor instead of the viewport).
 *  Without the portal, a sheet opened from inside a sticky row that
 *  uses `backdrop-blur-sm` ends up trapped inside the row. */
export function MobileBottomSheet({ open, onClose, title, children }: Props) {
  // `open` flips immediately when the caller dismisses, but we keep the
  // sheet mounted through the exit animation. `mounted` outlives `open`
  // by EXIT_MS; `exiting` flags the exit-animation classes during that
  // window so the slide-down + fade-out play before unmount.
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

  useLockBodyScroll(mounted && !exiting);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onClose]);

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-40 bg-[rgba(35,24,21,0.32)] flex items-end justify-center",
        exiting ? "animate-[fadeOut_180ms_ease-in]" : "animate-[fade_160ms_ease-out]",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-chalk flex flex-col w-full max-h-[75dvh] rounded-t-[18px] border-t border-x border-border-strong shadow-elev-3 overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          exiting
            ? "animate-[drawerSlideDown_200ms_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[drawerSlideUp_220ms_cubic-bezier(0.22,1,0.36,1)]",
        )}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="flex-none flex items-center justify-center pt-2.5 pb-1.5 hover:bg-[rgba(35,24,21,0.04)] cursor-pointer"
        >
          <span className="block w-10 h-1 rounded-full bg-walnut-2/40" />
        </button>
        {title && (
          <div className="px-4 pt-1 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-walnut-3">
            {title}
          </div>
        )}
        <div className="overflow-y-auto px-2 pb-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
