import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { AddAnotherSpeakerRow } from "./AddAnotherSpeakerRow";
import { EmptyRosterRow } from "./EmptyRosterRow";
import { PrayerRow } from "./PrayerRow";
import { SpeakerRow } from "./SpeakerRow";
import { canAddAnotherSpeaker, speakerPlaceholderCount } from "./utils/speakerSlots";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: WithId<Speaker>[];
}

/** Mobile body for a regular Sunday. Speaker rows render dynamically
 *  (floor of 2 placeholder rows on a fresh card, ceiling of 4 visible
 *  before the explicit "Add another speaker" affordance hides) so a
 *  partially-filled meeting doesn't push prayers off the visible
 *  list with empty noise. Prayer rows always render — bishops use
 *  them as the implicit footer. */
export function MobileSundayBody({ date, meeting, speakers }: Props) {
  const placeholderCount = speakerPlaceholderCount(speakers.length);
  const showAddAnother = canAddAnotherSpeaker(speakers.length);
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
              label="Assign Speaker"
              to={`/week/${date}/speaker/new/assign`}
            />
          );
        })}
        {showAddAnother && <AddAnotherSpeakerRow date={date} />}
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
