import { cn } from "@/lib/cn";

interface Props {
  savedAt?: Date | null;
  ready: boolean;
  remaining: number;
  busy?: boolean;
  onRequestApproval?: () => void;
  onPreview?: () => void;
}

export function ProgramSaveBar({ savedAt, ready, remaining, busy, onRequestApproval, onPreview }: Props) {
  const label = savedAt
    ? `Autosaved · ${formatRelative(savedAt)}`
    : "Autosave on";

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center gap-3.5 px-5 sm:px-8 py-3 bg-chalk border-t border-border shadow-[0_-6px_20px_rgba(35,24,21,0.08)]">
      <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-3">
        <span className="w-1.5 h-1.5 rounded-full bg-success" />
        {label}
      </div>
      <span className="flex-1" />
      {onPreview && (
        <button
          type="button"
          onClick={onPreview}
          className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
        >
          Preview print
        </button>
      )}
      <button
        type="button"
        onClick={onRequestApproval}
        disabled={!ready || busy || !onRequestApproval}
        className={cn(
          "font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border inline-flex items-center gap-1.5 transition-colors",
          ready
            ? "bg-success border-success text-chalk hover:bg-success/90"
            : "bg-bordeaux border-bordeaux-deep text-parchment hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)]",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {ready
          ? "Request approval"
          : `Finish ${remaining} item${remaining === 1 ? "" : "s"} to submit`}
      </button>
    </div>
  );
}

function formatRelative(d: Date): string {
  const diff = Math.round((Date.now() - d.getTime()) / 1000);
  if (diff < 5) return "just now";
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}
