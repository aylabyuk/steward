import { Link } from "react-router";
import type { Assignment, NonMeetingSunday, PrayerRole, SacramentMeeting } from "@/lib/types";
import { SpeakerStatusChip } from "@/features/plan-speakers/SpeakerStatusChip";
import { usePrayerParticipant } from "@/features/prayers/usePrayerParticipant";
import { AssignRow } from "../program/AssignRow";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";

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
          date={date}
          placeholder="Who will give the opening prayer?"
          assignment={meeting?.openingPrayer}
          onChange={(a) => void set("openingPrayer", a)}
        />
        <PrayerRowGroup
          label="Benediction"
          role="benediction"
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
  date: string;
  placeholder: string;
  assignment: Assignment | undefined;
  onChange: (a: Assignment) => void;
}

function PrayerRowGroup({ label, role, date, placeholder, assignment, onChange }: RowGroupProps) {
  const participant = usePrayerParticipant(date, role);
  const status = participant.data?.status ?? null;
  const hasName = Boolean(assignment?.person?.name?.trim() || participant.data?.name?.trim());

  return (
    <div>
      <AssignRow
        label={label}
        placeholder={placeholder}
        assignment={assignment}
        onChange={onChange}
      />
      {hasName && (
        <div className="flex items-center justify-end gap-2 pl-24.5 pr-10.5 -mt-1 mb-2">
          {status && status !== "planned" && <SpeakerStatusChip status={status} />}
          <Link
            to={`/week/${date}/prayer/${role}/prepare`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-bordeaux hover:text-bordeaux-deep underline-offset-2 hover:underline"
          >
            {status === "invited" || status === "confirmed" ? "Resend" : "Invite"} →
          </Link>
        </div>
      )}
    </div>
  );
}
