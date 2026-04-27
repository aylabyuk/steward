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
      {monthGroups.map((group) => (
        <section key={`${group.year}-${group.month}`} className="mb-6">
          <header className="sticky top-0 z-20 flex items-baseline justify-between px-4 h-12 bg-parchment border-b border-border">
            <h2 className="font-display font-semibold text-walnut text-lg tracking-[-0.01em]">
              {group.label}
            </h2>
            <span className="font-mono uppercase text-[10px] tracking-[0.12em] text-walnut-3">
              {group.sundays.length} Sundays
            </span>
          </header>
          {group.sundays.map((sunday) => (
            <MobileSundayBlock
              key={sunday.date}
              date={sunday.date}
              meeting={sunday.meeting}
              fallbackType={defaultMeetingType(sunday.date, nonMeetingSundays)}
              leadTimeDays={leadTimeDays}
              nonMeetingSundays={nonMeetingSundays}
            />
          ))}
        </section>
      ))}
    </div>
  );
}
