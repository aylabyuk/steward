import { useEffect, type ReactNode } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface Props {
  /** Controlled open state so the parent can auto-open when chat
   *  activity demands attention (e.g. a bishop reply lands while the
   *  drawer is collapsed). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Tiny badge in the FAB when there's something worth seeing —
   *  unread replies, a pending Yes/No ask, etc. */
  hint?: string | undefined;
  children: ReactNode;
}

/** Floating chat drawer for the speaker invite page. Collapsed, it
 *  shows a pill-shaped FAB bottom-right. Opened, it fills the screen
 *  on mobile and docks as a ~420px wide panel bottom-right on sm+.
 *  Body scroll is locked while open to keep the letter behind from
 *  rubber-banding on iOS. */
export function SpeakerChatFloatingDrawer({
  open,
  onOpenChange,
  hint,
  children,
}: Props): React.ReactElement {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onOpenChange(false);
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onOpenChange]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-bordeaux text-parchment font-sans text-[13.5px] font-semibold shadow-elev-3 hover:bg-bordeaux-deep pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        aria-label="Open conversation with the bishopric"
      >
        <ChatIcon />
        <span>Conversation</span>
        {hint && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] bg-parchment/20 px-1.5 py-0.5 rounded-full">
            {hint}
          </span>
        )}
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conversation with the bishopric"
      className="fixed inset-0 z-20 bg-[rgba(35,24,21,0.42)] flex items-stretch sm:items-end justify-end sm:p-4 animate-[fade_160ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div className="bg-chalk flex flex-col w-full h-dvh sm:h-[80dvh] sm:max-w-105 sm:rounded-[14px] sm:border sm:border-border-strong sm:shadow-elev-3 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ChatIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
