import { useSpeakers } from "@/hooks/useMeeting";
import type { Speaker } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  date: string;
}

type Row = {
  id: string;
  data: Speaker;
};

/** Step 2 of the Assign Speakers modal. Launches the full Prepare
 *  Invitation page (in a new tab) for each speaker still in `planned`
 *  status, and live-updates their status as the bishop works through
 *  them in parallel tabs. Already-handled speakers appear greyed out
 *  at the bottom so the bishop sees the full meeting state. */
export function SpeakerInvitationLauncher({ date }: Props) {
  const { data: speakers, loading } = useSpeakers(date);

  if (loading) {
    return <p className="font-serif italic text-[14px] text-walnut-3">Loading speakers…</p>;
  }

  const planned = speakers.filter((s) => s.data.status === "planned");
  const handled = speakers.filter(
    (s) => s.data.status === "invited" || s.data.status === "confirmed",
  );

  if (planned.length === 0 && handled.length === 0) {
    return (
      <p className="font-serif italic text-[14px] text-walnut-3">
        No speakers yet. Head back to step 1 to add some.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {planned.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <p className="font-serif text-[13.5px] text-walnut-2">
            Open each speaker to send their invitation. Status updates here as you mark them invited
            in the new tab.
          </p>
          {planned.map((s) => (
            <SpeakerRow key={s.id} row={s} date={date} state="planned" />
          ))}
        </div>
      )}
      {handled.length > 0 && (
        <div className="flex flex-col gap-2 pt-2 border-t border-border">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Already handled
          </p>
          {handled.map((s) => (
            <SpeakerRow
              key={s.id}
              row={s}
              date={date}
              state={s.data.status === "confirmed" ? "confirmed" : "invited"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SpeakerRow({
  row,
  date,
  state,
}: {
  row: Row;
  date: string;
  state: "planned" | "invited" | "confirmed";
}) {
  const { data } = row;
  const dimmed = state !== "planned";

  function openPrepare() {
    const url = `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(row.id)}/prepare`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-chalk p-3 flex flex-wrap items-center gap-3",
        dimmed && "opacity-70",
      )}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[15px] font-semibold text-walnut leading-tight">
            {data.name}
          </span>
          <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
            {data.role}
          </span>
        </div>
        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-walnut-3 font-serif italic">
          <span>✉ {data.email?.trim() ? data.email : "—"}</span>
          <span>☎ {data.phone?.trim() ? data.phone : "—"}</span>
        </div>
      </div>
      {state === "planned" && (
        <button
          type="button"
          onClick={openPrepare}
          aria-label={`Open prepare invitation for ${data.name}`}
          className="font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux bg-bordeaux text-parchment hover:bg-bordeaux-deep inline-flex items-center gap-1.5 transition-colors"
        >
          Open prepare →
        </button>
      )}
      {state === "invited" && (
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-brass-deep">
          Invited ✓
        </span>
      )}
      {state === "confirmed" && (
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-walnut-2">
          Confirmed ✓
        </span>
      )}
    </div>
  );
}
