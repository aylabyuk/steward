import { type SaveStatus, useSaveStatusStore } from "@/stores/saveStatusStore";

/**
 * The compact live status on the left of the ProgramSaveBar. Reads the
 * global save-status store so any write-path that reports saving/saved/
 * error (updateMeetingField, speaker actions, etc.) shows up here without
 * the editor components having to know about it.
 */
export function SaveIndicator() {
  const state = useSaveStatusStore((s) => s.status);
  return <Indicator state={state} />;
}

function Indicator({ state }: { state: SaveStatus }) {
  if (state.kind === "error") {
    return (
      <div className="flex min-w-0 items-center gap-2 font-sans text-[12.5px] text-bordeaux-deep">
        <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-bordeaux" />
        <span className="shrink-0 font-mono uppercase tracking-[0.14em] text-[10.5px] text-bordeaux whitespace-nowrap">
          Couldn't save
        </span>
        <span className="min-w-0 flex-1 font-serif italic text-walnut-2 truncate">
          {state.message}
        </span>
      </div>
    );
  }
  if (state.kind === "saving") {
    return (
      <Eyebrow color="bg-brass" pulse>
        Saving…
      </Eyebrow>
    );
  }
  if (state.kind === "saved") {
    return <Eyebrow color="bg-success">Autosaved · {formatRelative(state.at)}</Eyebrow>;
  }
  return <Eyebrow color="bg-walnut-3">Autosave on</Eyebrow>;
}

function Eyebrow({
  color,
  pulse,
  children,
}: {
  color: string;
  pulse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-3">
      <span className={`w-1.5 h-1.5 rounded-full ${color} ${pulse ? "animate-pulse" : ""}`} />
      {children}
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
