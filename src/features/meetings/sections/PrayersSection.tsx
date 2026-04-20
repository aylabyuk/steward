import { AssignmentField } from "@/features/assignments/AssignmentField";
import type { Assignment, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
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
    <div className="flex flex-col gap-3">
      <AssignmentField
        label="Opening prayer"
        assignment={meeting?.openingPrayer}
        onChange={(a) => void set("openingPrayer", a)}
      />
      <AssignmentField
        label="Benediction"
        assignment={meeting?.benediction}
        onChange={(a) => void set("benediction", a)}
      />
    </div>
  );
}
