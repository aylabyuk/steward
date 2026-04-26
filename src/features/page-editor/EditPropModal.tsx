import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface VariableOption {
  token: string;
  label: string;
}

interface Props {
  open: boolean;
  title: string;
  /** Current value to seed the editor with. Re-syncs every time the
   *  modal opens so re-opening on the same field shows the latest
   *  saved value, not a stale draft from a previous edit. */
  initial: string;
  variables?: ReadonlyArray<VariableOption>;
  /** When true, renders a textarea instead of a single-line input —
   *  useful for callout bodies. Enter still saves on the input form;
   *  on the textarea, save is via the button or Cmd/Ctrl+Enter. */
  multiline?: boolean;
  onSave: (next: string) => void;
  onCancel: () => void;
}

/** Replaces window.prompt for editing the props of insertable
 *  blocks (Callout / Signature / Letterhead). Same flow — click
 *  field → modal → save / cancel — but with two upgrades the
 *  native prompt couldn't offer:
 *
 *    1. Clickable variable chips that splice `{{token}}` into the
 *       editor at the current caret position so the bishop can
 *       embed dynamic values without typing braces.
 *    2. A real multi-line textarea for body fields where prompt
 *       was awkward.
 *
 *  Mounted through a portal at document.body so the editor's
 *  scroll / zoom containers don't clip it. */
export function EditPropModal({
  open,
  title,
  initial,
  variables,
  multiline,
  onSave,
  onCancel,
}: Props) {
  const [draft, setDraft] = useState(initial);
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(initial);
    const id = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    });
    return () => cancelAnimationFrame(id);
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  function insertVariable(token: string) {
    const el = inputRef.current;
    const chip = `{{${token}}}`;
    if (!el) {
      setDraft((d) => d + chip);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const next = el.value.slice(0, start) + chip + el.value.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + chip.length;
      el.setSelectionRange(caret, caret);
    });
  }

  if (!open) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-walnut/40"
      onMouseDown={onCancel}
    >
      <div
        role="dialog"
        aria-label={title}
        className="w-[420px] max-w-[92vw] rounded-lg border border-border-strong bg-chalk shadow-elev-3 flex flex-col"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-2 font-mono text-[10.5px] tracking-[0.16em] uppercase text-brass-deep">
          {title}
        </div>
        <div className="px-5 pb-2">
          {multiline ? (
            <textarea
              ref={(node) => {
                inputRef.current = node;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") onSave(draft);
              }}
              rows={4}
              className="w-full font-serif text-[15px] text-walnut bg-parchment-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-bordeaux resize-y"
            />
          ) : (
            <input
              ref={(node) => {
                inputRef.current = node;
              }}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave(draft);
              }}
              className="w-full font-serif text-[15px] text-walnut bg-parchment-2 border border-border rounded px-3 py-2 focus:outline-none focus:border-bordeaux"
            />
          )}
        </div>
        {variables && variables.length > 0 && (
          <div className="px-5 pb-3 flex flex-wrap gap-1.5">
            <span className="font-mono text-[9.5px] tracking-[0.14em] uppercase text-walnut-3 self-center mr-1">
              Insert:
            </span>
            {variables.map((v) => (
              <button
                key={v.token}
                type="button"
                onClick={() => insertVariable(v.token)}
                className="font-mono text-[10.5px] px-2 py-1 rounded border border-border bg-parchment hover:bg-parchment-3 text-walnut-2"
                title={`Inserts {{${v.token}}}`}
              >
                {v.label}
              </button>
            ))}
          </div>
        )}
        <div className="px-5 pb-4 pt-2 flex justify-end gap-2 border-t border-border">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded font-sans text-[13px] text-walnut hover:bg-parchment-2"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onSave(draft)}
            className="px-3 py-1.5 rounded font-sans text-[13px] text-chalk bg-bordeaux hover:bg-bordeaux-deep"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
