import type { Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { SpeakerStatusChip } from "./SpeakerStatusChip";
import { WizardFooter } from "./WizardFooter";

interface Props {
  speakers: WithId<Speaker>[];
  onBackToSchedule: () => void;
}

export function SummaryStep({ speakers, onBackToSchedule }: Props) {
  const counts = speakers.reduce<Record<string, number>>((acc, s) => {
    acc[s.data.status] = (acc[s.data.status] ?? 0) + 1;
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
              {rollup ? `Final state: ${rollup}.` : "No speakers to summarise."}
            </p>
          </div>

          <ul className="flex flex-col gap-2 list-none p-0 m-0">
            {speakers.map((s) => (
              <li
                key={s.id}
                className="bg-chalk border border-border rounded-md px-4 py-3 flex items-center justify-between gap-3"
              >
                <div className="flex flex-col">
                  <span className="font-sans text-[14px] font-semibold text-walnut">
                    {s.data.name}
                  </span>
                  {s.data.topic && (
                    <span className="font-serif text-[12.5px] text-walnut-2">{s.data.topic}</span>
                  )}
                </div>
                <SpeakerStatusChip status={s.data.status} />
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
