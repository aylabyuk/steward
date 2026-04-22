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

/** Full-screen preview trigger shown only on mobile (`lg:hidden`).
 *  Tapping opens the 8.5×11 letter sheet as an overlay that fills
 *  the viewport — gives the bishop a proper look at the letter even
 *  on a phone, without trying to cram a preview column beside the
 *  editor on a narrow screen. */
export function MobileLetterPreviewButton(props: Props) {
  const [open, setOpen] = useState(false);
  useLockBodyScroll(open);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden inline-flex items-center gap-2 rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-2 hover:bg-parchment-2"
      >
        <EyeIcon /> Preview letter
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
      width="12"
      height="12"
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
