import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { defaultMeetingType } from "@/features/meetings/utils/ensureMeetingDoc";
import { TwilioAutoConnect } from "@/features/invitations/TwilioAutoConnect";
import { TwilioChatProvider } from "@/features/invitations/TwilioChatProvider";
import { SubscribePrompt } from "@/features/notifications/SubscribePrompt";
import { useUpcomingMeetings } from "./hooks/useUpcomingMeetings";
import { useInfiniteHorizon } from "./hooks/useInfiniteHorizon";
import { useScrollRestore } from "@/hooks/useScrollRestore";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { getUpcomingSundayIso } from "@/lib/dates";
import { PageHead } from "./PageHead";
import { HorizonSelect } from "./HorizonSelect";
import { SundayCard } from "./SundayCard";
import { QuarterSection } from "./QuarterSection";
import { MobileScheduleList } from "./MobileScheduleList";
import { UpcomingPlanningBanner } from "./UpcomingPlanningBanner";
import { groupByMonth } from "./utils/groupByMonth";

const MOBILE_INITIAL_WEEKS = 4;
const MOBILE_STEP_WEEKS = 4;
// Matches the desktop dropdown's max (4-week increments up to 16).
// Past that, the bishopric is planning further out than is useful —
// speakers haven't been assigned to wards for those weeks yet.
const MOBILE_MAX_WEEKS = 16;

export function ScheduleView() {
  const [searchParams] = useSearchParams();
  const focusDate = searchParams.get("focus");
  // When the bishop arrives via "Edit from the schedule view", we
  // drive the scroll ourselves to land on the matching card —
  // turn off scroll-restore for this mount so it doesn't fight us.
  useScrollRestore("schedule", { enabled: !focusDate });
  const wardId = useCurrentWardStore((s) => s.wardId);
  const settingsState = useWardSettings();
  const defaultHorizon = settingsState.data?.settings.scheduleHorizonWeeks ?? 8;
  const leadTimeDays = settingsState.data?.settings.speakerLeadTimeDays ?? 14;
  const nonMeeting = settingsState.data?.settings.nonMeetingSundays ?? [];
  // Fall back to the browser's tz while the ward settings load — the
  // upcoming Sunday's local-day boundary lines up either way for any
  // ward in the same UTC offset, and the brief mismatch on first paint
  // self-corrects once settings arrive.
  const timezone =
    settingsState.data?.settings.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const upcoming = getUpcomingSundayIso(new Date(), timezone);
  const isMobile = useIsMobile();

  const [horizon, setHorizon] = useState(defaultHorizon);
  useEffect(() => {
    const stored = localStorage.getItem("schedule-horizon-weeks");
    if (stored) setHorizon(Number(stored));
  }, []);

  const {
    weeks: mobileHorizon,
    loading: loadingMore,
    sentinelRef,
  } = useInfiniteHorizon(isMobile, {
    initial: MOBILE_INITIAL_WEEKS,
    step: MOBILE_STEP_WEEKS,
    max: MOBILE_MAX_WEEKS,
  });

  const horizonInUse = isMobile ? mobileHorizon : horizon;
  const { slots, error } = useUpcomingMeetings(horizonInUse);

  if (!wardId) return null;

  if (error) {
    return (
      <main className="p-6 text-sm text-red-700">Failed to load schedule: {error.message}</main>
    );
  }

  const meetings = new Map(slots.map((s) => [s.date, s.meeting]));
  const dates = slots.map((s) => s.date);
  const monthGroups = groupByMonth(dates, meetings);

  return (
    <TwilioChatProvider>
      <TwilioAutoConnect wardId={wardId} />
      <main className="pb-12">
        <SubscribePrompt />

        <PageHead
          eyebrow="Sacrament meeting"
          title="Schedule"
          subtitle="Assign speakers for the weeks ahead."
          rightSlot={isMobile ? null : <HorizonSelect value={horizon} onChange={setHorizon} />}
        />

        <UpcomingPlanningBanner upcoming={upcoming} />

        {isMobile ? (
          <>
            <MobileScheduleList
              monthGroups={monthGroups}
              leadTimeDays={leadTimeDays}
              nonMeetingSundays={nonMeeting}
              focusDate={focusDate}
              upcoming={upcoming}
            />
            {mobileHorizon < MOBILE_MAX_WEEKS && (
              <div
                ref={sentinelRef}
                className="text-center py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3"
              >
                {loadingMore ? "Loading…" : ""}
              </div>
            )}
            {mobileHorizon >= MOBILE_MAX_WEEKS && (
              <div className="text-center py-6 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 border-t border-border/60">
                Showing up to 16 weeks ahead
              </div>
            )}
          </>
        ) : (
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
                    focused={sunday.date === focusDate}
                    editable={sunday.date === upcoming}
                  />
                ))}
              </QuarterSection>
            ))}
          </div>
        )}
      </main>
    </TwilioChatProvider>
  );
}
