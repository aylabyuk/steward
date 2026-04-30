import type { Assignment, NonMeetingSunday, PrayerRole, SacramentMeeting } from "@/lib/types";
import { PrayerChatLauncher } from "@/features/invitations/PrayerChatLauncher";
import { SpeakerStatusChip } from "@/features/speakers/SpeakerStatusChip";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { AssignRow } from "../program/AssignRow";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../utils/updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function PrayersSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  async function set(field: "openingPrayer" | "benediction", next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }

  return (
    <ProgramSection id="sec-prayers" label="Prayers">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-1">
        <PrayerRowGroup
          label="Opening"
          role="opening"
          wardId={wardId}
          date={date}
          placeholder="Who will give the opening prayer?"
          assignment={meeting?.openingPrayer}
          onChange={(a) => void set("openingPrayer", a)}
        />
        <PrayerRowGroup
          label="Benediction"
          role="benediction"
          wardId={wardId}
          date={date}
          placeholder="Who will give the benediction?"
          assignment={meeting?.benediction}
          onChange={(a) => void set("benediction", a)}
        />
      </div>
    </ProgramSection>
  );
}

interface RowGroupProps {
  label: string;
  role: PrayerRole;
  wardId: string;
  date: string;
  placeholder: string;
  assignment: Assignment | undefined;
  onChange: (a: Assignment) => void;
}

/** Per-prayer row in the meeting editor. The Invite/Resend trigger
 *  has moved to the schedule's "+ Plan prayers" entry point — the
 *  meeting editor stays focused on quick name capture. The status
 *  chip + chat launcher mirror the speaker rows so the bishop can
 *  open the prayer-giver chat from this surface too. */
function PrayerRowGroup({
  label,
  role,
  wardId,
  date,
  placeholder,
  assignment,
  onChange,
}: RowGroupProps) {
  const participant = usePrayerParticipant(date, role);
  const status = participant.data?.status ?? null;
  const inlineName = assignment?.person?.name?.trim() ?? "";
  const hasName = Boolean(inlineName || participant.data?.name?.trim());
  const showChip = participant.data && status && status !== "planned";
  const showLauncher = hasName && participant.data?.invitationId;

  return (
    <div>
      <AssignRow
        label={label}
        placeholder={placeholder}
        assignment={assignment}
        // Once a prayer participant doc exists, the structured status
        // chip + chat launcher take over from the legacy "confirmed"
        // toggle so the row reads like a speaker row.
        showStatus={!participant.data}
        onChange={onChange}
      />
      {(showChip || showLauncher) && (
        <div className="flex items-center justify-end gap-2 pl-24.5 pr-2 -mt-1 mb-2">
          {showChip && status && <SpeakerStatusChip status={status} />}
          {showLauncher && (
            <PrayerChatLauncher
              wardId={wardId}
              date={date}
              role={role}
              participant={participant.data ?? null}
              fallbackName={inlineName}
            />
          )}
        </div>
      )}
    </div>
  );
}
