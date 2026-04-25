import { useState } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { ProgramMargins, ProgramTemplateKey } from "@/lib/types";
import { ScaledProgramPreview } from "./ScaledProgramPreview";

interface Props {
  variant: ProgramTemplateKey;
  /** Lexical EditorState JSON, or `null` for an empty editor. */
  json: string | null;
  variables: Record<string, string>;
  margins?: ProgramMargins;
}

/** Mobile-only FAB that opens the 8.5 × 11 program preview as a
 *  full-viewport overlay. Sits above the SaveBar (`bottom-20`) so the
 *  bishop can flip to the preview without losing the Save chrome at
 *  the bottom of the page. Walnut tone (not bordeaux) so it doesn't
 *  compete with the Save button as a primary CTA. */
export function MobileProgramPreviewButton({ variant, json, variables, margins }: Props) {
  const [open, setOpen] = useState(false);
  useLockBodyScroll(open);

  const variantLabel =
    variant === "congregationProgram" ? "Congregation · 11 × 8.5 in" : "Conducting · 8.5 × 11 in";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Preview program"
        className="lg:hidden fixed bottom-20 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-walnut text-parchment px-4 py-3 font-sans text-[13px] font-semibold shadow-[0_8px_24px_rgba(58,37,25,0.35)] hover:bg-walnut-2 active:scale-95 transition-transform"
      >
        <EyeIcon />
        Preview
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-parchment lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Program preview"
        >
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-border bg-chalk">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
              {variantLabel}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut hover:bg-parchment-2"
            >
              Close
            </button>
          </div>
          <div className="flex-1 min-h-0 p-3 flex">
            {json ? (
              <ScaledProgramPreview
                variant={variant}
                json={json}
                variables={variables}
                margins={margins}
              />
            ) : (
              <div className="m-auto rounded-lg border border-border bg-chalk px-6 py-4 max-w-xs text-center">
                <p className="font-serif italic text-walnut-3 text-[13.5px]">
                  Empty template — write something on the editor first.
                </p>
              </div>
            )}
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
