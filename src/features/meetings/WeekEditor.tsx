import { useEffect, useState } from "react";
import { OverflowMenu } from "@/components/ui/OverflowMenu";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useCommentReadStore } from "@/stores/commentReadStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { CancelDialog } from "./CancelDialog";
import { CancellationBanner } from "./CancellationBanner";
import { defaultMeetingType, ensureMeetingDoc } from "./ensureMeetingDoc";
import { HistoryModal } from "./HistoryModal";
import { NO_MEETING_TYPES, TYPE_LABELS } from "./meetingLabels";
import { checkMeetingReadiness } from "./readiness";
import { LockBanner } from "./program/LockBanner";
import { ProgramApproval } from "./program/ProgramApproval";
import { ProgramHead } from "./program/ProgramHead";
import { ProgramSaveBar } from "./program/ProgramSaveBar";
import { ProgramSections } from "./program/ProgramSections";
import { ProgramSide } from "./program/ProgramSide";
import { ResetToDraftDialog } from "./program/ResetToDraftDialog";
import { StatusLegend } from "./program/StatusLegend";
import { buildRailSections } from "./program/railSections";
import { useApprovalActions } from "./program/useApprovalActions";
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
  const markRead = useCommentReadStore((s) => s.markRead);
  const approval = useApprovalActions({
    wardId: wardId ?? "",
    date,
    approvals: meeting.data?.approvals ?? [],
  });

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
  const canCancel = !isNonMeeting && !cancellation?.cancelled;
  const report = checkMeetingReadiness(meeting.data, speakers.data, type);
  const rail = buildRailSections(meeting.data, speakers.data, type, report);
  const currentStatus = meeting.data?.status ?? "draft";
  const liveApprovals = (meeting.data?.approvals ?? []).filter((a) => !a.invalidated).length;
  const isLocked = !isNonMeeting && currentStatus !== "draft" && currentStatus !== "published";

  const menuItems = [
    { label: "History", onSelect: () => setHistoryOpen(true) },
    ...(canCancel
      ? [{ label: "Cancel meeting…", onSelect: () => setConfirmingCancel(true), destructive: true }]
      : []),
  ];

  return (
    <main className="pb-30">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
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
                date={date}
                report={report}
                status={currentStatus}
                approvals={meeting.data?.approvals ?? []}
                requiredApprovals={meeting.data?.requiredApprovals}
                onRequestApproval={approval.requestApproval}
                onApprove={approval.approve}
                canApprove={approval.canApprove}
                alreadyApproved={approval.alreadyApproved}
                error={approval.error}
                busy={approval.busy}
                memberReady={approval.memberReady}
              />
              {isLocked && (
                <LockBanner status={currentStatus} onUnlock={approval.openResetDialog} />
              )}
              <div className="flex justify-center mb-4 lg:hidden">
                <StatusLegend />
              </div>
              <div
                className={isLocked ? "pointer-events-none opacity-60 select-none" : ""}
                aria-disabled={isLocked}
              >
                <ProgramSections
                  wardId={wardId}
                  date={date}
                  meeting={meeting.data}
                  type={type}
                  speakers={speakers.data}
                  nonMeetingSundays={nonMeeting}
                />
              </div>
              <ResetToDraftDialog
                open={approval.resetDialogOpen}
                status={currentStatus}
                liveApprovals={liveApprovals}
                onClose={approval.closeResetDialog}
                onConfirm={approval.resetToDraft}
              />
            </>
          )}
        </div>

        {!isNonMeeting && <ProgramSide wardId={wardId} date={date} rail={rail} />}
      </div>

      {!isNonMeeting && (
        <ProgramSaveBar
          status={currentStatus}
          ready={report.ready}
          remaining={report.missing.length + report.unconfirmed.length}
          busy={approval.busy}
          onRequestApproval={approval.requestApproval}
        />
      )}
      <HistoryModal date={date} open={historyOpen} onClose={() => setHistoryOpen(false)} />
    </main>
  );
}
