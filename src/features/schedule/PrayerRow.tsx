import { PrayerChatLauncher } from "@/features/invitations/PrayerChatLauncher";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { InvitationStatus, PrayerRole } from "@/lib/types";
import { cn } from "@/lib/cn";
import { EmptyRosterRow } from "./EmptyRosterRow";

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
  opening: "OP",
  benediction: "CP",
};

const ROLE_SUBTITLE: Record<PrayerRole, string> = {
  opening: "Invocation",
  benediction: "Benediction",
};

const ROLE_WIDTH_CLS = "w-6";

/** Sunday-card row for a prayer slot. Mirrors `SpeakerRow`'s rhythm:
 *  role label, name, status pill, chat launcher. Falls back to
 *  `EmptyRosterRow` when no name is set so unfilled prayer slots
 *  share their height + look with the speaker placeholder slots. */
export function PrayerRow({ inlineName, role, date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const { data: participant } = usePrayerParticipant(date, role);
  const name = participant?.name?.trim() || inlineName.trim();
  const status: InvitationStatus = participant?.status ?? "planned";

  if (!name) {
    return <EmptyRosterRow leadingLabel={ROLE_LABEL[role]} leadingWidthCls={ROLE_WIDTH_CLS} />;
  }

  return (
    <li className="flex items-center gap-3 h-16 border-b border-border last:border-b-0">
      <div
        className={`font-mono text-[10.5px] tracking-[0.08em] text-brass-deep shrink-0 ${ROLE_WIDTH_CLS}`}
      >
        {ROLE_LABEL[role]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-sm font-semibold text-walnut truncate">{name}</div>
        <div className="font-serif italic text-sm text-walnut-2 truncate">
          {ROLE_SUBTITLE[role]}
        </div>
      </div>
      <div
        className={cn(
          "font-mono text-[9.5px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border whitespace-nowrap",
          STATE_CLS[status],
        )}
      >
        {status}
      </div>
      <PrayerChatLauncher
        wardId={wardId}
        date={date}
        role={role}
        participant={participant ?? null}
        fallbackName={inlineName}
      />
    </li>
  );
}
