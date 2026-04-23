import { cn } from "@/lib/cn";

interface Props {
  dirty: boolean;
  saving: boolean;
  savedAt: string | null;
  error?: string | null;
  onDiscard: () => void;
  onSave: () => void;
}

/** Sticky bottom savebar from the Profile prototype. Shows a status
 *  pill + Discard + Save. Buttons are disabled when there's nothing
 *  to save. */
export function SaveBar({
  dirty,
  saving,
  savedAt,
  error,
  onDiscard,
  onSave,
}: Props): React.ReactElement {
  const statusLabel = error
    ? "Couldn't save — try again"
    : dirty
      ? "Unsaved changes"
      : savedAt
        ? `Saved · ${savedAt}`
        : "All caught up";
  return (
    <div className="fixed bottom-0 inset-x-0 z-30 flex items-center gap-3 px-5 sm:px-8 py-3 bg-chalk border-t border-border shadow-[0_-6px_20px_rgba(35,24,21,0.08)] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-3">
        <span
          aria-hidden="true"
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            error ? "bg-bordeaux" : dirty ? "bg-warning" : "bg-walnut-3",
          )}
        />
        {statusLabel}
      </div>
      <div className="flex-1" />
      <button
        type="button"
        onClick={onDiscard}
        disabled={!dirty || saving}
        className="font-sans text-[13px] font-semibold px-3 py-1.5 rounded-md text-walnut-2 hover:text-walnut hover:bg-parchment-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Discard
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={!dirty || saving}
        className={cn(
          "font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border transition-colors",
          dirty
            ? "bg-walnut text-parchment border-walnut hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)]"
            : "bg-chalk text-walnut-3 border-border-strong cursor-not-allowed",
        )}
      >
        {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
      </button>
    </div>
  );
}
