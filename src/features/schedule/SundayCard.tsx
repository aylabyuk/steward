import { useRef, useState } from "react";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useSpeakers } from "@/hooks/useMeeting";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { kindLabel } from "./kindLabel";
import { SpeakerEditList, type SpeakerEditListHandle } from "./SpeakerEditList";
import { AssignDialog } from "./AssignDialog";
import { SundayCardBody } from "./SundayCardBody";
import { SundayCardHeader } from "./SundayCardHeader";
import { formatShortDate } from "./dateFormat";
import { leadTimeSeverity } from "@/features/speakers/leadTime";

const SEVERITY_TEXT: Record<"warn" | "urgent", string> = {
  warn: "Less than 2 weeks notice — consider a later week.",
  urgent: "Short notice — confirm speakers directly.",
};

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function SundayCard({ date, meeting, fallbackType, leadTimeDays }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const type = meeting?.meetingType ?? fallbackType;
  const kind = kindLabel(type);
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const { data: speakers } = useSpeakers(date);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const editListRef = useRef<SpeakerEditListHandle>(null);
  const severity = leadTimeSeverity(new Date(), date, leadTimeDays);

  if (kind.variant === "noMeeting") {
    return (
      <article className="rounded-lg border border-border bg-parchment-2 p-4 text-walnut-2">
        <p className="text-sm">{kind.label} — no sacrament meeting</p>
      </article>
    );
  }

  if (cancelled) {
    return (
      <article className="rounded-lg border border-border bg-chalk p-4 shadow-elev-1">
        <p className="text-lg font-semibold text-walnut line-through">{formatShortDate(date)}</p>
        <p className="text-xs font-mono tracking-wider text-walnut-3 mt-1">Cancelled</p>
        {meeting?.cancellation?.reason && (
          <p className="text-sm text-walnut-2 mt-2">{meeting.cancellation.reason}</p>
        )}
      </article>
    );
  }

  async function handleSave() {
    if (!editListRef.current) return;
    setSaving(true);
    try {
      await editListRef.current.save();
      setAssignDialogOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="rounded-lg border border-border bg-chalk shadow-elev-1 hover:shadow-elev-2 hover:border-border-strong transition-all duration-200">
      <SundayCardHeader date={date} urgent={severity === "urgent"} />

      {severity !== "none" && (
        <div className="mx-4 mb-3 rounded-md border border-danger-soft bg-danger-soft/30 px-3 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-bordeaux shrink-0" />
          <span className="text-[12.5px] text-bordeaux-deep">{SEVERITY_TEXT[severity]}</span>
        </div>
      )}

      <SundayCardBody speakers={speakers} onAddSpeaker={() => setAssignDialogOpen(true)} />

      <AssignDialog
        open={assignDialogOpen}
        title={formatShortDate(date)}
        saving={saving}
        onClose={() => setAssignDialogOpen(false)}
        onSave={handleSave}
      >
        <SpeakerEditList ref={editListRef} date={date} wardId={wardId} />
      </AssignDialog>
    </article>
  );
}
