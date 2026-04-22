import { useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { ScaledLetterPreview } from "./ScaledLetterPreview";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
}

/** Mobile-only floating action button that opens the 8.5×11 preview
 *  as a full-viewport overlay. `fixed` bottom-right so it's always
 *  reachable while the bishop edits the letter below. Hidden at
 *  `lg:` where the preview column is always visible alongside the
 *  editor. */
export function MobileLetterPreviewButton(props: Props) {
  const [open, setOpen] = useState(false);
  useLockBodyScroll(open);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Preview letter"
        className="lg:hidden fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-bordeaux text-chalk px-4 py-3 font-sans text-[13px] font-semibold shadow-[0_8px_24px_rgba(58,37,25,0.35)] hover:bg-bordeaux-deep active:scale-95 transition-transform"
      >
        <EyeIcon />
        Preview
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-parchment lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Letter preview"
        >
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-chalk">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
              Letter preview
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut hover:bg-parchment-2"
            >
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 p-3">
            <ScaledLetterPreview {...props} height="100%" />
          </div>
        </div>
      )}
    </>
  );
}

function EyeIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
