import type { Assignment, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { emptyAssignment } from "@/lib/types";
import { AssignRow } from "../program/AssignRow";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function SacramentSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  const blessers = meeting?.sacramentBlessers ?? [];
  const b1 = blessers[0] ?? emptyAssignment();
  const b2 = blessers[1] ?? emptyAssignment();

  async function setBread(next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { sacramentBread: next });
  }

  async function setBlesser(idx: 0 | 1, next: Assignment) {
    const updated = [b1, b2];
    updated[idx] = next;
    await updateMeetingField(wardId, date, nonMeetingSundays, { sacramentBlessers: updated });
  }

  return (
    <ProgramSection id="sec-sacrament" label="Sacrament">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-1">
        <AssignRow
          label="Bread"
          placeholder="Quorum or individual"
          assignment={meeting?.sacramentBread}
          onChange={(a) => void setBread(a)}
        />
        <div />
        <AssignRow
          label="Blesser 1"
          placeholder="First blesser"
          assignment={b1}
          onChange={(a) => void setBlesser(0, a)}
        />
        <AssignRow
          label="Blesser 2"
          placeholder="Second blesser"
          assignment={b2}
          onChange={(a) => void setBlesser(1, a)}
        />
      </div>
    </ProgramSection>
  );
}
