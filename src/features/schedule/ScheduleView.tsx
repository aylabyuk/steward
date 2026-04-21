import { useEffect, useState } from "react";
import { defaultMeetingType } from "@/features/meetings/ensureMeetingDoc";
import { SubscribePrompt } from "@/features/notifications/SubscribePrompt";
import { useUpcomingMeetings } from "@/hooks/useUpcomingMeetings";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { PageHead } from "./PageHead";
import { HorizonSelect } from "./HorizonSelect";
import { SundayCard } from "./SundayCard";
import { QuarterSection } from "./QuarterSection";
import { groupByMonth } from "./groupByMonth";

export function ScheduleView() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const settingsState = useWardSettings();
  const defaultHorizon = settingsState.data?.settings.scheduleHorizonWeeks ?? 8;
  const leadTimeDays = settingsState.data?.settings.speakerLeadTimeDays ?? 14;
  const nonMeeting = settingsState.data?.settings.nonMeetingSundays ?? [];

  const [horizon, setHorizon] = useState(defaultHorizon);
  useEffect(() => {
    const stored = localStorage.getItem("schedule-horizon-weeks");
    if (stored) setHorizon(Number(stored));
  }, []);

  const { slots, loading, error } = useUpcomingMeetings(horizon);

  if (!wardId) return null;

  if (error) {
    return <main className="p-6 text-sm text-red-700">Failed to load schedule: {error.message}</main>;
  }

  const meetings = new Map(slots.map((s) => [s.date, s.meeting]));
  const dates = slots.map((s) => s.date);
  const monthGroups = groupByMonth(dates, meetings);

  return (
    <main className="p-4 sm:px-8 sm:py-7 max-w-380 mx-auto">
      <SubscribePrompt />

      <PageHead
        eyebrow="Sacrament meeting"
        title="Schedule"
        subtitle="Assign speakers for the weeks ahead."
        rightSlot={<HorizonSelect value={horizon} onChange={setHorizon} />}
      />

      <div className="mt-8">
        {monthGroups.map((group) => (
          <QuarterSection
            key={`${group.year}-${group.month}`}
            title={group.label}
            count={group.sundays.length}
          >
            {group.sundays.map((sunday) => (
              <SundayCard
                key={sunday.date}
                date={sunday.date}
                meeting={sunday.meeting}
                fallbackType={defaultMeetingType(sunday.date, nonMeeting)}
                leadTimeDays={leadTimeDays}
                nonMeetingSundays={nonMeeting}
              />
            ))}
          </QuarterSection>
        ))}
      </div>
    </main>
  );
}
