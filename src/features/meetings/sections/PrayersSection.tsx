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

export function PrayersSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  async function set(field: "openingPrayer" | "benediction", next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }

  return (
    <ProgramSection id="sec-prayers" label="Prayers">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-7 gap-y-1">
        <AssignRow
          label="Opening"
          placeholder="Who will give the opening prayer?"
          assignment={meeting?.openingPrayer}
          onChange={(a) => void set("openingPrayer", a)}
        />
        <AssignRow
          label="Benediction"
          placeholder="Who will give the benediction?"
          assignment={meeting?.benediction}
          onChange={(a) => void set("benediction", a)}
        />
      </div>
    </ProgramSection>
  );
}
