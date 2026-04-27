import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { SpeakerRow } from "./SpeakerRow";
import { PrayerRow } from "./PrayerRow";
import { EmptyRosterRow } from "./EmptyRosterRow";

const SPEAKER_SLOT_COUNT = 4;

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: WithId<Speaker>[];
}

/** Mobile body for a regular Sunday. Always renders 4 speaker slots
 *  + 2 prayer slots — empty slots fall back to "Not assigned"
 *  placeholder rows. Mirrors the desktop card body's vertical rhythm
 *  so the list reads as a consistent table without requiring the
 *  user to count present-vs-missing. The kebab menu in the date row
 *  is the entry point for "Plan speakers" / "Plan prayers" actions. */
export function MobileSundayBody({ date, meeting, speakers }: Props) {
  const placeholderCount = Math.max(0, SPEAKER_SLOT_COUNT - speakers.length);
  return (
    <div className="px-4 pb-3">
      <ul className="list-none m-0 p-0">
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
      <ul className="list-none m-0 p-0 border-t-2 border-walnut-3 pt-1 mt-2">
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
