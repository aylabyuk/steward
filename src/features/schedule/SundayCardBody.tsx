import { Link } from "@/lib/nav";
import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { EmptyRosterRow } from "./EmptyRosterRow";
import { PrayerRow } from "./PrayerRow";
import { SpeakerRow } from "./SpeakerRow";

const SPEAKER_SLOT_COUNT = 4;

interface Props {
  speakers: WithId<Speaker>[];
  date: string;
  meeting: SacramentMeeting | null;
}

export function SundayCardBody({ speakers, date, meeting }: Props) {
  // Fixed slot count keeps every Sunday card the same height across
  // the schedule grid — actual speakers fill the first slots, empty
  // placeholder rows back-fill up to SPEAKER_SLOT_COUNT.
  const placeholderCount = Math.max(0, SPEAKER_SLOT_COUNT - speakers.length);
  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
      <ul className="list-none m-0 p-0 mb-2">
        {speakers.map((s, idx) => (
          <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} speakerId={s.id} date={date} />
        ))}
        {Array.from({ length: placeholderCount }, (_, i) => {
          const slot = speakers.length + i + 1;
          return (
            <EmptyRosterRow
              key={`empty-speaker-${slot}`}
              leadingLabel={String(slot).padStart(2, "0")}
            />
          );
        })}
      </ul>
      <ul className="list-none m-0 p-0 mb-2 border-t-2 border-walnut-3 pt-1">
        <PrayerRow
          role="opening"
          date={date}
          inlineName={meeting?.openingPrayer?.person?.name ?? ""}
        />
        <PrayerRow
          role="benediction"
          date={date}
          inlineName={meeting?.benediction?.person?.name ?? ""}
        />
      </ul>
      <div className="flex flex-wrap gap-x-5 gap-y-1 md:opacity-0 md:transition-opacity md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <PlanLink to={`/plan/${date}`} label="Plan speakers" />
        <PlanLink to={`/plan/${date}/prayers`} label="Plan prayers" />
      </div>
    </div>
  );
}

function PlanLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-[13px] font-sans font-semibold text-bordeaux hover:text-bordeaux-deep transition-colors py-1.5"
    >
      <span className="w-4 h-4 border border-bordeaux rounded-sm flex items-center justify-center">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </span>
      {label}
    </Link>
  );
}
