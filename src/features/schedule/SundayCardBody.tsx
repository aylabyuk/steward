import { Link } from "react-router";
import type { SacramentMeeting, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { PrayerRow } from "./PrayerRow";
import { SpeakerRow } from "./SpeakerRow";

interface Props {
  speakers: WithId<Speaker>[];
  date: string;
  meeting: SacramentMeeting | null;
}

export function SundayCardBody({ speakers, date, meeting }: Props) {
  const hasSpeakers = speakers.length > 0;
  return (
    <div className="px-4 pb-4">
      {hasSpeakers ? (
        <ul className="list-none m-0 p-0 mb-2">
          {speakers.map((s, idx) => (
            <SpeakerRow key={s.id} number={idx + 1} speaker={s.data} speakerId={s.id} date={date} />
          ))}
        </ul>
      ) : (
        <p className="font-serif italic text-sm text-walnut-3 py-2">No speakers yet.</p>
      )}
      <ul className="list-none m-0 p-0 mb-2 border-t border-border pt-1">
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
      <div className="flex flex-wrap gap-x-5 gap-y-1">
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
