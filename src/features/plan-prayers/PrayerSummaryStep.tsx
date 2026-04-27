import type { PrayerParticipant } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { SpeakerStatusChip } from "@/features/plan-speakers/SpeakerStatusChip";
import { WizardFooter } from "@/features/plan-speakers/WizardFooter";

interface Props {
  participants: WithId<PrayerParticipant>[];
  onBackToSchedule: () => void;
}

const ROLE_HEADING = {
  opening: "Opening prayer",
  benediction: "Benediction",
} as const;

/** Mirror of `SummaryStep` for prayer-givers. */
export function PrayerSummaryStep({ participants, onBackToSchedule }: Props) {
  const named = participants.filter((p) => p.data.name?.trim());
  const counts = named.reduce<Record<string, number>>((acc, p) => {
    const status = p.data.status ?? "planned";
    acc[status] = (acc[status] ?? 0) + 1;
    return acc;
  }, {});
  const rollup = Object.entries(counts)
    .map(([status, n]) => `${n} ${status}`)
    .join(", ");

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5 flex flex-col gap-5">
          <div>
            <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">All set.</h2>
            <p className="font-serif text-[14px] text-walnut-2 leading-relaxed">
              {rollup ? `Final state: ${rollup}.` : "No prayer-givers to summarise."}
            </p>
          </div>

          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {named.map((p) => (
              <li
                key={p.id}
                className="bg-chalk border border-border rounded-md px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
                    {ROLE_HEADING[p.data.role]}
                  </span>
                  <span className="font-sans text-[14px] font-semibold text-walnut">
                    {p.data.name}
                  </span>
                </div>
                <SpeakerStatusChip status={p.data.status ?? "planned"} />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <WizardFooter align="end">
        <button
          type="button"
          onClick={onBackToSchedule}
          className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep"
        >
          Back to schedule →
        </button>
      </WizardFooter>
    </div>
  );
}
