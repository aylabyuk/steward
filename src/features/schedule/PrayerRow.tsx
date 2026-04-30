import { PrayerChatLauncher } from "@/features/invitations/PrayerChatLauncher";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { Link } from "@/lib/nav";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { InvitationStatus, PrayerRole } from "@/lib/types";
import { EmptyRosterRow } from "./EmptyRosterRow";
import { StatusIndicator } from "./StatusIndicator";

interface Props {
  /** Lightweight inline name from `meeting.{role}.person.name`. The
   *  participant doc's `name` takes precedence when present. */
  inlineName: string;
  role: PrayerRole;
  date: string;
  /** Mobile list view collapses unfilled rows; pass `true` to render
   *  nothing (instead of an `EmptyRosterRow`) when no name is set. */
  hideEmpty?: boolean;
}

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "OP",
  benediction: "CP",
};

const ROLE_SUBTITLE: Record<PrayerRole, string> = {
  opening: "Invocation",
  benediction: "Closing Prayer",
};

const ROLE_ASSIGN_LABEL: Record<PrayerRole, string> = {
  opening: "Assign Opening Prayer",
  benediction: "Assign Closing Prayer",
};

const ROLE_WIDTH_CLS = "w-6";

/** Sunday-card row for a prayer slot. Mirrors `SpeakerRow`'s rhythm:
 *  name primary, role label as italic-serif subtitle (parity with the
 *  speaker row's topic line), status pill, chat launcher. Falls back
 *  to `EmptyRosterRow` when no name is set so unfilled prayer slots
 *  share their height + look with the speaker placeholder slots. */
export function PrayerRow({ inlineName, role, date, hideEmpty = false }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const { data: participant } = usePrayerParticipant(date, role);
  const name = participant?.name?.trim() || inlineName.trim();
  const status: InvitationStatus = participant?.status ?? "planned";

  if (!name) {
    if (hideEmpty) return null;
    return (
      <EmptyRosterRow
        leadingLabel={ROLE_LABEL[role]}
        leadingWidthCls={ROLE_WIDTH_CLS}
        label={ROLE_ASSIGN_LABEL[role]}
        to={`/week/${date}/prayer/${role}/assign`}
      />
    );
  }

  return (
    <li className="flex items-center gap-3 h-16 border-b border-border last:border-b-0">
      <Link
        to={`/week/${date}/prayer/${role}/assign`}
        className="flex items-center gap-3 flex-1 min-w-0 hover:bg-parchment-2 transition-colors -mx-1 px-1 rounded-sm"
      >
        <div className="flex-1 min-w-0">
          <div className="font-sans text-sm font-semibold text-walnut truncate">{name}</div>
          <div className="font-serif italic text-sm text-walnut-2 truncate">
            {ROLE_SUBTITLE[role]}
          </div>
        </div>
        <StatusIndicator status={status} />
      </Link>
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
