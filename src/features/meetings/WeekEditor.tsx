import { useEffect, useState } from "react";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { TwilioAutoConnect } from "@/features/invitations/TwilioAutoConnect";
import { TwilioChatProvider } from "@/features/invitations/TwilioChatProvider";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCommentReadStore } from "@/stores/commentReadStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { CancellationBanner } from "./CancellationBanner";
import { defaultMeetingType, ensureMeetingDoc } from "./utils/ensureMeetingDoc";
import { HistoryModal } from "./HistoryModal";
import { NO_MEETING_TYPES, TYPE_LABELS } from "./utils/meetingLabels";
import { checkMeetingReadiness } from "./utils/readiness";
import { PrintReadinessPanel } from "./program/PrintReadinessPanel";
import { ProgramHead } from "./program/ProgramHead";
import { ProgramSaveBar } from "./program/ProgramSaveBar";
import { ProgramSections } from "./program/ProgramSections";
import { ProgramSide } from "./program/ProgramSide";
import { StatusLegend } from "./program/StatusLegend";
import { buildRailSections } from "./program/utils/railSections";

interface Props {
  date: string;
}

export function WeekEditor({ date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const settings = useWardSettings();
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);
  const [historyOpen, setHistoryOpen] = useState(false);
  const markRead = useCommentReadStore((s) => s.markRead);

  useEffect(() => {
    if (wardId) markRead(wardId, date);
  }, [wardId, date, markRead]);

  const settingsLoaded = Boolean(settings.data);
  useEffect(() => {
    if (!wardId || !settingsLoaded) return;
    const nonMeetingSundays = settings.data?.settings.nonMeetingSundays ?? [];
    void ensureMeetingDoc(wardId, date, nonMeetingSundays);
  }, [wardId, date, settingsLoaded, settings.data]);

  if (!wardId) return null;

  const nonMeeting = settings.data?.settings.nonMeetingSundays ?? [];
  const type = meeting.data?.meetingType ?? defaultMeetingType(date, nonMeeting);
  const cancellation = meeting.data?.cancellation;
  const isNonMeeting = NO_MEETING_TYPES.has(type);
  const report = checkMeetingReadiness(meeting.data, speakers.data, type);
  const rail = buildRailSections(meeting.data, speakers.data, type, report);

  const menuItems = [{ label: "History", onSelect: () => setHistoryOpen(true) }];

  return (
    <TwilioChatProvider>
      <TwilioAutoConnect wardId={wardId} />
      <main className="pb-30">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div>
            <ProgramHead date={date} type={type} rightSlot={<OverflowMenu items={menuItems} />} />

            <CancellationBanner wardId={wardId} date={date} cancellation={cancellation} />

            {isNonMeeting ? (
              <div className="rounded-xl border border-border bg-parchment-2 p-5 text-sm text-walnut-2">
                No sacrament meeting is held on {TYPE_LABELS[type].toLowerCase()} Sundays.
              </div>
            ) : (
              <>
                <PrintReadinessPanel date={date} report={report} />
                <div className="flex justify-center mb-4 lg:hidden">
                  <StatusLegend />
                </div>
                <ProgramSections
                  wardId={wardId}
                  date={date}
                  meeting={meeting.data}
                  type={type}
                  speakers={speakers.data}
                  nonMeetingSundays={nonMeeting}
                />
              </>
            )}
          </div>

          {!isNonMeeting && <ProgramSide wardId={wardId} date={date} rail={rail} />}
        </div>

        {!isNonMeeting && (
          <ProgramSaveBar
            date={date}
            ready={report.ready}
            remaining={report.missing.length + report.unconfirmed.length}
          />
        )}
        <HistoryModal date={date} open={historyOpen} onClose={() => setHistoryOpen(false)} />
      </main>
    </TwilioChatProvider>
  );
}
