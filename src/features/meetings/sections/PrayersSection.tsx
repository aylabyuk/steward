import type { PrayerRole, SacramentMeeting, SpeakerStatus } from "@/lib/types";
import { PrayerChatLauncher } from "@/features/invitations/PrayerChatLauncher";
import { SpeakerStatusChip } from "@/features/speakers/SpeakerStatusChip";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { Link } from "@/lib/nav";
import { cn } from "@/lib/cn";
import { ProgramSection } from "../program/ProgramSection";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
}

export function PrayersSection({ wardId, date, meeting }: Props) {
  return (
    <ProgramSection
      id="sec-prayers"
      label="Prayers"
      rightSlot={
        <Link
          to={`/schedule?focus=${date}`}
          className="ml-auto font-serif italic text-[12.5px] text-walnut-3 underline decoration-dotted decoration-walnut-3/60 underline-offset-2 hover:text-bordeaux hover:decoration-bordeaux transition-colors"
        >
          Edit from the schedule view
        </Link>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 -mx-5">
        <PrayerListRow
          role="opening"
          wardId={wardId}
          date={date}
          inlineName={meeting?.openingPrayer?.person?.name ?? ""}
        />
        <PrayerListRow
          role="benediction"
          wardId={wardId}
          date={date}
          inlineName={meeting?.benediction?.person?.name ?? ""}
        />
      </div>
    </ProgramSection>
  );
}

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "OP",
  benediction: "CP",
};

const ROLE_SUBTITLE: Record<PrayerRole, string> = {
  opening: "Opening Prayer",
  benediction: "Closing Prayer",
};

interface RowProps {
  role: PrayerRole;
  wardId: string;
  date: string;
  /** Lightweight inline name from `meeting.{role}.person.name`. The
   *  participant doc's `name` takes precedence when present. */
  inlineName: string;
}

/** Per-prayer row in the meeting editor. Mirrors `SpeakerListRow`'s
 *  rhythm so the form reads as one coherent list — leading mono
 *  column (OP/CP), name + role subtitle, status chip, chat launcher.
 *  Read-only: speakers + prayers are both edited from the schedule
 *  view, so the body is a static row, not a link. The chat launcher
 *  is the only interactive surface here. */
function PrayerListRow({ role, wardId, date, inlineName }: RowProps) {
  const { data: participant } = usePrayerParticipant(date, role);
  const name = participant?.name?.trim() || inlineName.trim();
  const status: SpeakerStatus = participant?.status ?? "planned";
  return (
    <div className="flex items-center gap-2.5 py-2.5 px-5 border-b border-dashed border-border last:border-b-0 lg:nth-last-2:border-b-0">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep w-7 shrink-0">
          {ROLE_LABEL[role]}
        </span>
        <div className="min-w-0">
          <div
            className={cn(
              "font-sans text-[14.5px] leading-tight truncate",
              name ? "font-semibold text-walnut" : "italic font-medium text-walnut-3",
            )}
          >
            {name || "Unassigned"}
          </div>
          <div className="font-serif italic text-[13px] text-walnut-2 mt-0.5 truncate">
            {ROLE_SUBTITLE[role]}
          </div>
        </div>
      </div>
      <SpeakerStatusChip status={status} />
      {name && (
        <PrayerChatLauncher
          wardId={wardId}
          date={date}
          role={role}
          participant={participant ?? null}
          fallbackName={inlineName}
        />
      )}
    </div>
  );
}
