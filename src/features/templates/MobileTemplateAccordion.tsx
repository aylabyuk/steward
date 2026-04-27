import { useState } from "react";
import { ChevronDown, PencilIcon } from "./utils/accordionIcons";

interface Props {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  preview: React.ReactElement;
  canEdit: boolean;
  onRequestEdit: () => void;
  className?: string;
}

/** Mobile-only row for a template section: collapsed header with a
 *  pencil button; expanding reveals a one-line description and the
 *  preview pane. Variables + editor live in the modal behind the
 *  pencil (the parent owns that state — the pencil just notifies via
 *  `onRequestEdit`). */
export function MobileTemplateAccordion({
  sectionId,
  eyebrow,
  title,
  description,
  preview,
  canEdit,
  onRequestEdit,
  className,
}: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const rootClass = [
    "bg-chalk border border-border rounded-lg mb-3 scroll-mt-24 overflow-hidden",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <section id={sectionId} className={rootClass}>
      <div className="flex items-center gap-2 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex-1 flex items-center gap-3 text-left min-w-0 hover:opacity-80 transition-opacity"
        >
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-0.5">
              {eyebrow}
            </div>
            <div className="font-display text-[16px] font-semibold text-walnut leading-snug">
              {title}
            </div>
          </div>
          <ChevronDown
            className={`shrink-0 text-walnut-3 transition-transform ${open ? "rotate-180" : ""}`}
          />
        </button>
        <button
          type="button"
          onClick={onRequestEdit}
          disabled={!canEdit}
          aria-label={`Edit ${title}`}
          className="shrink-0 p-2 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PencilIcon />
        </button>
      </div>
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <div className="font-serif italic text-[13px] text-walnut-2 my-3">{description}</div>
          {preview}
        </div>
      )}
    </section>
  );
}
