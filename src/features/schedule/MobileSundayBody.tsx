import { Link } from "react-router";
import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { SpeakerRow } from "./SpeakerRow";
import { PrayerRow } from "./PrayerRow";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: WithId<Speaker>[];
}

export function MobileSundayBody({ date, meeting, speakers }: Props) {
  const openingName = meeting?.openingPrayer?.person?.name ?? "";
  const benedictionName = meeting?.benediction?.person?.name ?? "";
  const hasPrayers = Boolean(openingName.trim() || benedictionName.trim());

  return (
    <div className="px-4 pb-3">
      {speakers.length > 0 ? (
        <ul className="list-none m-0 p-0">
          {speakers.map((s, idx) => (
            <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} speakerId={s.id} date={date} />
          ))}
        </ul>
      ) : (
        <PlanLink to={`/plan/${date}`} label="Plan speakers" />
      )}
      {hasPrayers ? (
        <ul className="list-none m-0 p-0 border-t-2 border-walnut-3 pt-1 mt-2">
          <PrayerRow role="opening" date={date} inlineName={openingName} hideEmpty />
          <PrayerRow role="benediction" date={date} inlineName={benedictionName} hideEmpty />
        </ul>
      ) : (
        <PlanLink to={`/plan/${date}/prayers`} label="Plan prayers" />
      )}
    </div>
  );
}

function PlanLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1.5 text-[13px] font-sans font-semibold text-bordeaux py-3"
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
