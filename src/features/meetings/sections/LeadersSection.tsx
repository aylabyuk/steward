import type { Assignment, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { AssignRow } from "../program/AssignRow";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function LeadersSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  async function set(field: "presiding" | "conducting", next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }

  return (
    <ProgramSection id="sec-leaders" label="Leaders">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-1">
        <AssignRow
          label="Presiding"
          placeholder="e.g. Bishop Reeves"
          assignment={meeting?.presiding}
          onChange={(a) => void set("presiding", a)}
        />
        <AssignRow
          label="Conducting"
          placeholder="e.g. Brother Tan"
          assignment={meeting?.conducting}
          onChange={(a) => void set("conducting", a)}
        />
      </div>
    </ProgramSection>
  );
}
