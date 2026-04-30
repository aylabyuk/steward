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
              label="Assign Speaker"
              to={`/week/${date}/speaker/new/assign`}
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
    </div>
  );
}
