import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { AddAnotherSpeakerRow } from "./AddAnotherSpeakerRow";
import { EmptyRosterRow } from "./EmptyRosterRow";
import { PrayerRow } from "./PrayerRow";
import { SpeakerRow } from "./SpeakerRow";
import { canAddAnotherSpeaker, speakerPlaceholderCount } from "./utils/speakerSlots";

interface Props {
  speakers: WithId<Speaker>[];
  date: string;
  meeting: SacramentMeeting | null;
}

/** Desktop schedule card body. Speaker rows render dynamically: the
 *  card holds at least the floor (2) so a fresh card invites action,
 *  grows naturally as speakers are added, and stops at the ceiling
 *  (4) by hiding the explicit "Add another speaker" affordance —
 *  rosters that legitimately need a 5th can still be backed by data,
 *  but the typical card stays visually compact. Mirrors the iOS
 *  `MeetingCardBody` slot rules. */
export function SundayCardBody({ speakers, date, meeting }: Props) {
  const placeholderCount = speakerPlaceholderCount(speakers.length);
  const showAddAnother = canAddAnotherSpeaker(speakers.length);
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
        {showAddAnother && <AddAnotherSpeakerRow date={date} />}
      </ul>
      <ul className="list-none m-0 p-0 mb-2 mt-auto border-t-2 border-walnut-3 pt-1">
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
