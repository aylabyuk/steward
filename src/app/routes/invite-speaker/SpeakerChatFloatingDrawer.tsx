import { useEffect, useState, type ReactNode } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";
import type { CtaVariant } from "./SpeakerChatCTABanner";

const EXIT_MS = 200;

interface Props {
  /** Controlled open state so the parent can auto-open when chat
   *  activity demands attention (e.g. a bishop reply lands while the
   *  drawer is collapsed). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the FAB draws attention via a pulse ring, larger size,
   *  and a variant-specific label. `null` renders the calm FAB. */
  attention?: CtaVariant | null;
  children: ReactNode;
}

/** Floating chat drawer for the speaker invite page. Collapsed, it
 *  shows a pill-shaped FAB bottom-right. Opened on **mobile**, it
 *  slides up from the bottom as a sheet (with a grab handle and
 *  rounded top corners) so the top of the letter remains visible
 *  behind it. Opened on **desktop** (sm+), it docks as a ~420px
 *  wide panel in the bottom-right with a small inset — the speaker
 *  has the screen real estate to keep the letter visible alongside
 *  it. Body scroll is locked while open to keep the letter behind
 *  from rubber-banding on iOS. */
export function SpeakerChatFloatingDrawer({
  open,
  onOpenChange,
  attention,
  children,
}: Props): React.ReactElement {
  // Keep the drawer mounted through its slide-down so dismissal mirrors
  // the slide-up entrance instead of vanishing instantly.
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
      onOpenChange(false);
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onOpenChange]);

  if (!mounted) {
    const label =
      attention === "reply"
        ? "Reply to the bishopric"
        : attention === "unread"
          ? "New message"
          : "Conversation";
    const pulseStyle: React.CSSProperties | undefined = attention
      ? { animation: "fabPulse 1.8s ease-out infinite" }
      : undefined;
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        style={pulseStyle}
        className={
          attention
            ? "fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-bordeaux text-parchment font-sans text-[14px] font-semibold shadow-elev-3 hover:bg-bordeaux-deep pb-[max(0.875rem,env(safe-area-inset-bottom))]"
            : "fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-bordeaux text-parchment font-sans text-[13.5px] font-semibold shadow-elev-3 hover:bg-bordeaux-deep pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        }
        aria-label={`${label} — open the conversation with the bishopric`}
      >
        <ChatIcon />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Conversation with the bishopric"
      className={cn(
        "fixed inset-0 z-20 bg-[rgba(35,24,21,0.32)] flex items-end justify-center sm:justify-end sm:p-4",
        exiting ? "animate-[fadeOut_180ms_ease-in]" : "animate-[fade_160ms_ease-out]",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      <div
        className={cn(
          "bg-chalk flex flex-col w-full h-[85dvh] rounded-t-[18px] border-t border-x border-border-strong shadow-elev-3 overflow-hidden sm:h-[80dvh] sm:max-w-105 sm:rounded-[14px] sm:border-b",
          exiting
            ? "animate-[drawerSlideDown_200ms_cubic-bezier(0.4,0,1,1)_forwards]"
            : "animate-[drawerSlideUp_220ms_cubic-bezier(0.22,1,0.36,1)]",
        )}
      >
        <button
          type="button"
          aria-label="Close conversation"
          onClick={() => onOpenChange(false)}
          className="flex-none flex items-center justify-center pt-2.5 pb-1.5 hover:bg-[rgba(35,24,21,0.04)] cursor-pointer sm:hidden"
        >
          <span className="block w-10 h-1 rounded-full bg-walnut-2/40" />
        </button>
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
