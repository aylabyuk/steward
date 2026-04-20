import { useUpcomingMeetings } from "@/hooks/useUpcomingMeetings";
import { useWardSettings } from "@/hooks/useWardSettings";
import { defaultMeetingType } from "@/features/meetings/ensureMeetingDoc";
import { MeetingCard } from "./MeetingCard";

export function ScheduleView() {
  const settingsState = useWardSettings();
  const horizon = settingsState.data?.settings.scheduleHorizonWeeks ?? 8;
  const nonMeeting = settingsState.data?.settings.nonMeetingSundays ?? [];
  const { slots, loading, error } = useUpcomingMeetings(horizon);

  if (error) {
    return (
      <main className="p-6 text-sm text-red-700">Failed to load schedule: {error.message}</main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <header className="mb-4 flex items-baseline justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Schedule</h1>
        <span className="text-xs text-slate-500">
          {loading ? "Loading…" : `${slots.length} week${slots.length === 1 ? "" : "s"}`}
        </span>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {slots.map((slot) => (
          <MeetingCard
            key={slot.date}
            date={slot.date}
            meeting={slot.meeting}
            fallbackType={defaultMeetingType(slot.date, nonMeeting)}
          />
        ))}
      </div>
    </main>
  );
}
