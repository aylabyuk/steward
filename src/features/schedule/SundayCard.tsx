import { useEffect, useRef, useState } from "react";
import type { MeetingType, NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { useSpeakers } from "@/hooks/useMeeting";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { cn } from "@/lib/cn";
import { kindLabel, type KindVariant } from "./kindLabel";
import { SpeakerEditList, type SpeakerEditListHandle } from "./SpeakerEditList";
import { SpeakerInvitationLauncher } from "./SpeakerInvitationLauncher";
import { AssignDialog } from "./AssignDialog";
import { EditFooter, InviteFooter } from "./AssignDialogFooters";
import { SundayCardBody } from "./SundayCardBody";
import { SundayCardCancelled } from "./SundayCardCancelled";
import { SundayCardHeader } from "./SundayCardHeader";
import { SundayCardSpecial } from "./SundayCardSpecial";
import { formatShortDate } from "./dateFormat";
import { leadTimeSeverity } from "@/features/speakers/leadTime";

const SEVERITY_TEXT: Record<"warn" | "urgent", string> = {
  warn: "Less than 2 weeks notice — consider a later week.",
  urgent: "Short notice — confirm speakers directly.",
};

const CARD_BG: Record<KindVariant, string> = {
  regular: "bg-chalk",
  fast: "bg-chalk bg-[linear-gradient(180deg,rgba(224,190,135,0.14),rgba(224,190,135,0.04))] border-brass-soft",
  stake: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
  general: "bg-chalk bg-[linear-gradient(180deg,rgba(139,46,42,0.05),rgba(139,46,42,0.01))]",
};

type Step = "edit" | "invite";

interface Props {
  date: string;
  meeting: SacramentMeeting | null;
  fallbackType: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function SundayCard({
  date,
  meeting,
  fallbackType,
  leadTimeDays,
  nonMeetingSundays,
}: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const type = meeting?.meetingType ?? fallbackType;
  const kind = kindLabel(type);
  const cancelled = Boolean(meeting?.cancellation?.cancelled);
  const { data: speakers } = useSpeakers(date);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [step, setStep] = useState<Step>("edit");
  const [saving, setSaving] = useState(false);
  const editListRef = useRef<SpeakerEditListHandle>(null);
  const severity = leadTimeSeverity(new Date(), date, leadTimeDays);
  const hasConfirmedSpeaker = speakers.some((s) => s.data.status === "confirmed");

  // Always start on step 1 whenever the dialog opens. Response review
  // + apply now live on the per-speaker chat icon on the Sunday card,
  // not inside step 2, so there's no reason to skip the editor.
  useEffect(() => {
    if (assignDialogOpen) setStep("edit");
  }, [assignDialogOpen]);

  if (cancelled) {
    return (
      <SundayCardCancelled
        date={date}
        {...(meeting?.cancellation?.reason ? { reason: meeting.cancellation.reason } : {})}
      />
    );
  }

  async function handleSave() {
    if (!editListRef.current) return;
    setSaving(true);
    try {
      const plannedCount = await editListRef.current.save();
      // If nobody's left in "planned", there's nothing to invite —
      // close the modal entirely. Otherwise advance to step 2.
      if (plannedCount === 0) setAssignDialogOpen(false);
      else setStep("invite");
    } finally {
      setSaving(false);
    }
  }

  const title =
    step === "invite" ? `Send invitations — ${formatShortDate(date)}` : formatShortDate(date);

  return (
    <article className={cn("rounded-lg border border-border shadow-elev-1", CARD_BG[kind.variant])}>
      <SundayCardHeader
        date={date}
        wardId={wardId}
        currentType={type}
        nonMeetingSundays={nonMeetingSundays}
        urgent={severity === "urgent"}
        {...(kind.badge ? { badge: kind.badge } : {})}
        variant={kind.variant}
        locked={hasConfirmedSpeaker}
      />

      {!kind.isSpecial && severity !== "none" && (
        <div className="mx-4 mb-3 rounded-md border border-danger-soft bg-danger-soft/30 px-3 py-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-bordeaux shrink-0" />
          <span className="text-[12.5px] text-bordeaux-deep">{SEVERITY_TEXT[severity]}</span>
        </div>
      )}

      {kind.isSpecial ? (
        <SundayCardSpecial
          variant={kind.variant}
          stampLabel={kind.stampLabel}
          description={kind.description}
        />
      ) : (
        <SundayCardBody
          speakers={speakers}
          date={date}
          onAddSpeaker={() => setAssignDialogOpen(true)}
        />
      )}

      <AssignDialog
        open={assignDialogOpen}
        title={title}
        onClose={() => setAssignDialogOpen(false)}
        footerSlot={
          step === "edit" ? (
            <EditFooter
              saving={saving}
              onCancel={() => setAssignDialogOpen(false)}
              onSave={handleSave}
            />
          ) : (
            <InviteFooter
              onBack={() => setStep("edit")}
              onDone={() => setAssignDialogOpen(false)}
            />
          )
        }
      >
        {step === "edit" ? (
          <SpeakerEditList
            ref={editListRef}
            date={date}
            wardId={wardId}
            nonMeetingSundays={nonMeetingSundays}
          />
        ) : (
          <SpeakerInvitationLauncher date={date} speakers={speakers} />
        )}
      </AssignDialog>
    </article>
  );
}
