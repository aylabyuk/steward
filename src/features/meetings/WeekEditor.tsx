import { useEffect, useState } from "react";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { CommentThread } from "@/features/comments/CommentThread";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useCommentReadStore } from "@/stores/commentReadStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { CancelDialog } from "./CancelDialog";
import { CancellationBanner } from "./CancellationBanner";
import { defaultMeetingType } from "./ensureMeetingDoc";
import { HistoryModal } from "./HistoryModal";
import { NO_MEETING_TYPES, TYPE_LABELS } from "./meetingLabels";
import { requestApproval } from "./approvals";
import { checkMeetingReadiness } from "./readiness";
import { BusinessSection } from "./sections/BusinessSection";
import { HymnsSection } from "./sections/HymnsSection";
import { LeadersSection } from "./sections/LeadersSection";
import { MusicSection } from "./sections/MusicSection";
import { PrayersSection } from "./sections/PrayersSection";
import { SacramentSection } from "./sections/SacramentSection";
import { SpeakersSection } from "./sections/SpeakersSection";
import { ProgramApproval } from "./program/ProgramApproval";
import { ProgramHead } from "./program/ProgramHead";
import { ProgramRail } from "./program/ProgramRail";
import { ProgramSaveBar } from "./program/ProgramSaveBar";
import { StatusLegend } from "./program/StatusLegend";
import { buildRailSections } from "./program/railSections";
import { cancelMeeting } from "./updateMeeting";

interface Props {
  date: string;
}

export function WeekEditor({ date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUid = useAuthStore((s) => s.user?.uid);
  const settings = useWardSettings();
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const markRead = useCommentReadStore((s) => s.markRead);

  useEffect(() => {
    if (wardId) markRead(wardId, date);
  }, [wardId, date, markRead]);

  if (!wardId) return null;

  const nonMeeting = settings.data?.settings.nonMeetingSundays ?? [];
  const type = meeting.data?.meetingType ?? defaultMeetingType(date, nonMeeting);
  const cancellation = meeting.data?.cancellation;
  const isNonMeeting = NO_MEETING_TYPES.has(type);
  const canCancel = !isNonMeeting && !cancellation?.cancelled;
  const report = checkMeetingReadiness(meeting.data, speakers.data, type);
  const rail = buildRailSections(meeting.data, speakers.data, type, report);

  const menuItems = [
    { label: "History", onSelect: () => setHistoryOpen(true) },
    ...(canCancel
      ? [{ label: "Cancel meeting…", onSelect: () => setConfirmingCancel(true), destructive: true }]
      : []),
  ];

  async function handleRequestApproval() {
    setBusy(true);
    try {
      await requestApproval(wardId!, date);
    } finally {
      setBusy(false);
    }
  }

  const sectionProps = {
    wardId,
    date,
    meeting: meeting.data,
    nonMeetingSundays: nonMeeting,
  };

  return (
    <main className="max-w-295 mx-auto px-4 sm:px-8 pt-7 pb-30">
      <div className="grid gap-10 min-[900px]:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <ProgramHead date={date} type={type} rightSlot={<OverflowMenu items={menuItems} />} />

          <CancellationBanner wardId={wardId} date={date} cancellation={cancellation} />
          <CancelDialog
            open={confirmingCancel}
            onClose={() => setConfirmingCancel(false)}
            onConfirm={async (reason) => {
              if (!authUid) return;
              await cancelMeeting(wardId, date, reason, authUid, nonMeeting);
            }}
          />

          {isNonMeeting ? (
            <div className="rounded-xl border border-border bg-parchment-2 p-5 text-sm text-walnut-2">
              No sacrament meeting is held on {TYPE_LABELS[type].toLowerCase()} Sundays.
            </div>
          ) : (
            <>
              <ProgramApproval
                report={report}
                status={meeting.data?.status ?? "draft"}
                onRequestApproval={() => void handleRequestApproval()}
                busy={busy}
              />
              <div className="flex justify-center mb-4">
                <StatusLegend />
              </div>
              <LeadersSection {...sectionProps} />
              <PrayersSection {...sectionProps} />
              <MusicSection {...sectionProps} />
              <SacramentSection {...sectionProps} />
              {type === "regular" && (
                <SpeakersSection
                  wardId={wardId}
                  date={date}
                  speakers={speakers.data}
                  mid={meeting.data?.mid}
                  nonMeetingSundays={nonMeeting}
                />
              )}
              <HymnsSection {...sectionProps} type={type} />
              <BusinessSection {...sectionProps} />
            </>
          )}
        </div>

        {!isNonMeeting && (
          <div className="flex flex-col gap-4 min-w-0">
            <ProgramRail sections={rail} />
            <CommentThread wardId={wardId} date={date} />
          </div>
        )}
      </div>

      {!isNonMeeting && (
        <ProgramSaveBar
          savedAt={new Date()}
          ready={report.ready}
          remaining={report.missing.length + report.unconfirmed.length}
          busy={busy}
          onRequestApproval={() => void handleRequestApproval()}
        />
      )}
      <HistoryModal date={date} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </main>
  );
}
