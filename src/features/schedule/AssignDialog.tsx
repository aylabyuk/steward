import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Pinned bottom band rendered as-is. When omitted, the dialog has
   *  no footer — step bodies that own their own terminal actions can
   *  render them inline. */
  footerSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export function AssignDialog({ open, title, onClose, footerSlot, children }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleEsc);
    // Lock background scroll while modal is open. Preserve any prior inline
    // overflow so we can restore exactly what was there (in case another
    // consumer already set it).
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const isMobile = window.matchMedia("(max-width: 640px)").matches;

  return (
    <div
      className="fixed inset-0 z-50 bg-[rgba(35,24,21,0.42)] flex items-stretch sm:items-center justify-center sm:p-5 animate-[fade_160ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={cn(
          "bg-chalk border border-border-strong shadow-elev-3 overflow-hidden flex flex-col w-full",
          isMobile
            ? "absolute bottom-0 left-0 right-0 rounded-t-[14px] max-h-[95vh] animate-[slideIn_200ms_ease-out]"
            : "relative rounded-[14px] w-[96vw] max-w-140 lg:max-w-4xl xl:max-w-350 2xl:max-w-450 max-h-[94vh] animate-[fadePop_200ms_ease-out]",
        )}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5.5 py-4.5 border-b border-border bg-chalk">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
              Assign speakers
            </div>
            <div className="font-display text-2xl font-semibold text-walnut tracking-[-0.01em] leading-tight mt-0.5">
              {title}
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut px-2 py-1 transition-colors"
            aria-label="Close"
          >
            Close
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5.5 py-4.5 bg-chalk">{children}</div>

        {/* Footer (slot — each step owns its own button row) */}
        {footerSlot && (
          <div className="flex items-center justify-end gap-2 px-5.5 py-3.5 border-t border-border bg-parchment">
            {footerSlot}
          </div>
        )}
      </div>
    </div>
  );
}
