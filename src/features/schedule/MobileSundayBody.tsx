import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { SpeakerRow } from "./SpeakerRow";
import { PrayerRow } from "./PrayerRow";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: WithId<Speaker>[];
}

/** Mobile body for a regular Sunday. Real speakers + real prayers
 *  only — empty slots collapse. The kebab menu in the date header is
 *  the entry point for "Plan speakers" / "Plan prayers" so the body
 *  stays purely informational. When a Sunday has nothing planned, the
 *  body renders nothing — the date row alone communicates the state. */
export function MobileSundayBody({ date, meeting, speakers }: Props) {
  const openingName = meeting?.openingPrayer?.person?.name ?? "";
  const benedictionName = meeting?.benediction?.person?.name ?? "";
  const hasPrayers = Boolean(openingName.trim() || benedictionName.trim());

  if (speakers.length === 0 && !hasPrayers) return null;

  return (
    <div className="px-4 pb-3">
      {speakers.length > 0 && (
        <ul className="list-none m-0 p-0">
          {speakers.map((s, idx) => (
            <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} speakerId={s.id} date={date} />
          ))}
        </ul>
      )}
      {hasPrayers && (
        <ul className="list-none m-0 p-0 border-t-2 border-walnut-3 pt-1 mt-2">
          <PrayerRow role="opening" date={date} inlineName={openingName} hideEmpty />
          <PrayerRow role="benediction" date={date} inlineName={benedictionName} hideEmpty />
        </ul>
      )}
    </div>
  );
}
