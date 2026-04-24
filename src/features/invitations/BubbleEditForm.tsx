import { cn } from "@/lib/cn";

interface Props {
  draft: string;
  setDraft: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
  mine: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

/** Inline textarea form that replaces the bubble body while the user
 *  is editing one of their messages. Enter saves, Shift+Enter inserts
 *  a newline, Escape cancels. Colour tokens pivot on `mine` so the
 *  contrast still passes on the bordeaux "mine" bubble. */
export function BubbleEditForm({
  draft,
  setDraft,
  onCancel,
  onSave,
  saving,
  mine,
  textareaRef,
}: Props) {
  return (
    <div className="flex flex-col gap-1.5 min-w-48">
      <textarea
        ref={textareaRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        disabled={saving}
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSave();
          }
          if (e.key === "Escape") {
            e.preventDefault();
            onCancel();
          }
        }}
        className={cn(
          "font-sans text-[14px] leading-snug rounded-md p-2 resize-none focus:outline-none",
          mine
            ? "bg-bordeaux-deep text-parchment border border-bordeaux-deep focus:border-parchment/40"
            : "bg-chalk text-walnut border border-border-strong focus:border-bordeaux",
        )}
      />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.14em] px-2 py-1 rounded-md transition-colors",
            mine
              ? "text-parchment/75 hover:text-parchment hover:bg-bordeaux-deep"
              : "text-walnut-3 hover:text-walnut hover:bg-parchment-2",
          )}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className={cn(
            "font-mono text-[10px] uppercase tracking-[0.14em] px-2.5 py-1 rounded-md font-semibold transition-colors",
            mine
              ? "bg-parchment text-bordeaux hover:bg-chalk disabled:opacity-60"
              : "bg-bordeaux text-parchment hover:bg-bordeaux-deep disabled:opacity-60",
          )}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
