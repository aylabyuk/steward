import { AssignmentField } from "@/features/assignments/AssignmentField";
import type { Assignment, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { updateMeetingField } from "../updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function MusicSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  async function set(field: "pianist" | "chorister", next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: next });
  }

  return (
    <div className="flex flex-col gap-3">
      <AssignmentField
        label="Pianist"
        assignment={meeting?.pianist}
        onChange={(a) => void set("pianist", a)}
      />
      <AssignmentField
        label="Chorister"
        assignment={meeting?.chorister}
        onChange={(a) => void set("chorister", a)}
      />
    </div>
  );
}
