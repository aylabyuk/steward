import { useSpeakers } from "@/hooks/useMeeting";
import type { Speaker } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  date: string;
}

interface Row {
  id: string;
  data: Speaker;
}
type CardState = "planned" | "invited" | "confirmed";

function cardStateFor(status: Speaker["status"]): CardState {
  if (status === "invited") return "invited";
  if (status === "confirmed") return "confirmed";
  return "planned";
}

/** Step 2 of the Assign Speakers modal. Reuses the same grid + card
 *  shell as <SpeakerEditList> so the modal dimensions stay stable
 *  between steps — only the card contents swap. Planned rows get an
 *  "Open prepare →" action; invited/confirmed rows render dimmed with
 *  a status badge. Declined speakers are hidden (different flow). */
export function SpeakerInvitationLauncher({ date }: Props) {
  const { data: speakers, loading } = useSpeakers(date);

  if (loading) {
    return <p className="font-serif italic text-[14px] text-walnut-3">Loading speakers…</p>;
  }

  const rows = speakers.filter((s) => s.data.status !== "declined");

  if (rows.length === 0) {
    return (
      <p className="font-serif italic text-[14px] text-walnut-3">
        No speakers yet. Head back to step 1 to add some.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif text-[13.5px] text-walnut-2">
        Open each speaker to send their invitation. Status updates here as you mark them invited in
        the new tab.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3.5">
        {rows.map((s, i) => (
          <SpeakerLaunchCard
            key={s.id}
            row={s}
            index={i}
            date={date}
            state={cardStateFor(s.data.status)}
          />
        ))}
      </div>
    </div>
  );
}

function SpeakerLaunchCard({
  row,
  index,
  date,
  state,
}: {
  row: Row;
  index: number;
  date: string;
  state: CardState;
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
        "bg-chalk border border-border rounded-lg p-3 flex flex-col gap-2.5",
        dimmed && "opacity-70",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Speaker · {String(index + 1).padStart(2, "0")}
        </span>
        {state === "invited" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
            Invited ✓
          </span>
        )}
        {state === "confirmed" && (
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-2">
            Confirmed ✓
          </span>
        )}
      </div>

      <div className="flex items-baseline flex-wrap gap-x-2 gap-y-0.5">
        <span className="font-display text-[16px] font-semibold text-walnut leading-tight">
          {data.name}
        </span>
        <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-walnut-3">
          {data.role}
        </span>
      </div>

      <div className="flex flex-col gap-0.5 text-[12.5px] text-walnut-3 font-serif italic">
        <span>✉ {data.email?.trim() ? data.email : "—"}</span>
        <span>☎ {data.phone?.trim() ? data.phone : "—"}</span>
        {data.topic?.trim() && (
          <span className="not-italic font-sans text-walnut-2 mt-0.5">“{data.topic}”</span>
        )}
      </div>

      {state === "planned" && (
        <button
          type="button"
          onClick={openPrepare}
          aria-label={`Open prepare invitation for ${data.name}`}
          className="mt-auto font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] inline-flex items-center justify-center gap-1.5 transition-colors"
        >
          Open prepare →
        </button>
      )}
    </div>
  );
}
