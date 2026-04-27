import { defaultMeetingType } from "@/features/meetings/utils/ensureMeetingDoc";
import type { NonMeetingSunday } from "@/lib/types";
import type { MonthGroup } from "./utils/groupByMonth";
import { MobileSundayBlock } from "./MobileSundayBlock";

interface Props {
  monthGroups: readonly MonthGroup[];
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function MobileScheduleList({ monthGroups, leadTimeDays, nonMeetingSundays }: Props) {
  return (
    <div className="-mx-4 sm:mx-0">
      {monthGroups.flatMap((group) =>
        group.sundays.map((sunday) => (
          <MobileSundayBlock
            key={sunday.date}
            date={sunday.date}
            meeting={sunday.meeting}
            fallbackType={defaultMeetingType(sunday.date, nonMeetingSundays)}
            leadTimeDays={leadTimeDays}
            nonMeetingSundays={nonMeetingSundays}
          />
        )),
      )}
    </div>
  );
}
