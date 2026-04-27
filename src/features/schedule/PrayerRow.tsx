import { PrayerChatLauncher } from "@/features/invitations/PrayerChatLauncher";
import { usePrayerParticipant } from "@/features/prayers/usePrayerParticipant";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { InvitationStatus, PrayerRole } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  /** Lightweight inline name from `meeting.{role}.person.name`. The
   *  participant doc's `name` takes precedence when present. */
  inlineName: string;
  role: PrayerRole;
  date: string;
}

const STATE_CLS: Record<InvitationStatus, string> = {
  planned: "bg-parchment-2 text-walnut-2 border-border",
  invited: "bg-brass-soft/40 text-brass-deep border-brass-soft",
  confirmed: "bg-success-soft text-success border-success-soft",
  declined: "bg-danger-soft text-bordeaux border-danger-soft",
};

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "Opening",
  benediction: "Benediction",
};

/** Sunday-card row for a prayer slot. Mirrors `SpeakerRow`'s rhythm:
 *  number / role label, name, status pill, chat launcher. The status
 *  + launcher are only meaningful once the prayer has a participant
 *  doc (i.e. the bishop has interacted via "Plan prayers" or the
 *  meeting editor's PrayersSection). */
export function PrayerRow({ inlineName, role, date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const { data: participant } = usePrayerParticipant(date, role);
  const name = participant?.name?.trim() || inlineName.trim();
  const status: InvitationStatus = participant?.status ?? "planned";

  return (
    <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <div className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep w-12 shrink-0">
        {ROLE_LABEL[role]}
      </div>
      <div className="flex-1 min-w-0">
        {name ? (
          <div className="font-sans text-sm font-semibold text-walnut truncate">{name}</div>
        ) : (
          <div className="font-serif italic text-sm text-walnut-3 truncate">Not assigned</div>
        )}
      </div>
      {participant && (
        <div
          className={cn(
            "font-mono text-[9.5px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border whitespace-nowrap",
            STATE_CLS[status],
          )}
        >
          {status}
        </div>
      )}
      {name && (
        <PrayerChatLauncher
          wardId={wardId}
          date={date}
          role={role}
          participant={participant ?? null}
          fallbackName={inlineName}
        />
      )}
    </li>
  );
}
