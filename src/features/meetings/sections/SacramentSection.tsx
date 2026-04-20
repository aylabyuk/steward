import { AssignmentField } from "@/features/assignments/AssignmentField";
import type { Assignment, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { updateMeetingField } from "../updateMeeting";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

const EMPTY: Assignment = { person: null, status: "not_assigned" };

export function SacramentSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  const blessers = meeting?.sacramentBlessers ?? [EMPTY, EMPTY];
  // Enforce exactly 2 slots, pad if needed.
  const [b1, b2] = [blessers[0] ?? EMPTY, blessers[1] ?? EMPTY];

  async function setBread(next: Assignment) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { sacramentBread: next });
  }

  async function setBlesser(idx: 0 | 1, next: Assignment) {
    const updated = [b1, b2];
    updated[idx] = next;
    await updateMeetingField(wardId, date, nonMeetingSundays, { sacramentBlessers: updated });
  }

  return (
    <div className="flex flex-col gap-3">
      <AssignmentField
        label="Bread"
        assignment={meeting?.sacramentBread}
        onChange={(a) => void setBread(a)}
      />
      <AssignmentField label="Blesser 1" assignment={b1} onChange={(a) => void setBlesser(0, a)} />
      <AssignmentField label="Blesser 2" assignment={b2} onChange={(a) => void setBlesser(1, a)} />
    </div>
  );
}
