import { useEffect, type ReactNode } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

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
 *  or "Sunday actions". Desktop callers should keep their existing
 *  absolute-positioned popover; this primitive doesn't render a
 *  responsive variant. */
export function MobileBottomSheet({ open, onClose, title, children }: Props) {
  useLockBodyScroll(open);

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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 bg-[rgba(35,24,21,0.32)] flex items-end justify-center animate-[fade_160ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-chalk flex flex-col w-full max-h-[75dvh] rounded-t-[18px] border-t border-x border-border-strong shadow-elev-3 overflow-hidden animate-[drawerSlideUp_220ms_cubic-bezier(0.22,1,0.36,1)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
    </div>
  );
}
