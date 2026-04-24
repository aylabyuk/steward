import { useState } from "react";
import { CheckIcon, PrintIcon, SendIcon } from "@/features/schedule/SpeakerInviteIcons";
import { PrepareInvitationDialogs } from "./PrepareInvitationDialogs";
import { PrepareInvitationGroupBtn as GroupBtn } from "./PrepareInvitationGroupBtn";
import { RevertIcon, SmsIcon } from "./PrepareInvitationIcons";

interface Props {
  busy: boolean;
  canSend: boolean;
  canSendReason: string | null;
  canSms: boolean;
  canSmsReason: string | null;
  hasOverride: boolean;
  speakerName: string;
  /** Current email / phone on file for the speaker. Used to prefill
   *  the Send-channel dialog; empty strings are handled (the dialog
   *  treats them as a first-time-add flow). */
  speakerEmail: string;
  speakerPhone: string;
  onRevert: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
  /** Called with the final email the bishop confirmed in the dialog.
   *  The parent is responsible for persisting it to the speaker doc
   *  when it differs from what was on file. */
  onSend: (email: string) => void;
  onSendSms: (phone: string) => void;
}

type PendingConfirm = "revert" | "markInvited" | "printAndMarkInvited" | null;
type PendingSend = "email" | "sms" | null;

/** Top-of-page action toolbar for the Prepare Invitation page.
 *  Icon-only buttons in a connected group — labels travel via `title`
 *  (desktop tooltip) and `aria-label` (screen readers). Send Email
 *  and Send SMS are always enabled; they open a SendChannelDialog
 *  that lets the bishop confirm or edit the destination (saving any
 *  change to the speaker record) before firing. Other destructive /
 *  side-effecting actions gate on a ConfirmDialog. Cancel lives on
 *  the page chrome, not in this toolbar. */
export function PrepareInvitationActionBar({
  busy,
  canSend,
  canSendReason,
  canSms,
  canSmsReason,
  hasOverride,
  speakerName,
  speakerEmail,
  speakerPhone,
  onRevert,
  onMarkInvited,
  onPrint,
  onSend,
  onSendSms,
}: Props) {
  const [pending, setPending] = useState<PendingConfirm>(null);
  const [pendingSend, setPendingSend] = useState<PendingSend>(null);

  const hint = canSendReason ?? canSmsReason;
  // When neither channel is available, printing is the only "I've
  // sent" signal — surface a confirm that also flips status to
  // invited so the record stays in sync with reality. Speakers with
  // contact keep the plain print-only behavior (they can still use
  // Send or Mark invited buttons explicitly).
  const printTriggersMarkInvited = !canSend && !canSms;
  const printHandler = printTriggersMarkInvited ? () => setPending("printAndMarkInvited") : onPrint;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="inline-flex isolate rounded-md shadow-[0_1px_0_rgba(35,24,21,0.08)]">
        <GroupBtn
          position="first"
          label={hasOverride ? "Clear per-speaker override" : "Revert to ward default"}
          indicator={hasOverride}
          onClick={() => setPending("revert")}
          disabled={busy}
        >
          <RevertIcon />
        </GroupBtn>
        <GroupBtn
          position="mid"
          label="Mark invited only"
          onClick={() => setPending("markInvited")}
          disabled={busy}
        >
          <CheckIcon />
        </GroupBtn>
        <GroupBtn
          position="mid"
          label={printTriggersMarkInvited ? "Print letter and mark invited" : "Print letter"}
          onClick={printHandler}
          disabled={busy}
        >
          <PrintIcon />
        </GroupBtn>
        <GroupBtn
          position="mid"
          label="Send SMS"
          onClick={() => setPendingSend("sms")}
          disabled={busy}
        >
          <SmsIcon />
        </GroupBtn>
        <GroupBtn
          position="last"
          label="Send email"
          onClick={() => setPendingSend("email")}
          disabled={busy}
          primary
        >
          <SendIcon />
        </GroupBtn>
      </div>
      {hint && (
        <span className="font-serif italic text-[11px] sm:text-[11.5px] text-walnut-3">{hint}</span>
      )}

      <PrepareInvitationDialogs
        pending={pending}
        pendingSend={pendingSend}
        busy={busy}
        hasOverride={hasOverride}
        speakerName={speakerName}
        speakerEmail={speakerEmail}
        speakerPhone={speakerPhone}
        onCancelPending={() => setPending(null)}
        onCancelPendingSend={() => setPendingSend(null)}
        onRevert={onRevert}
        onMarkInvited={onMarkInvited}
        onPrint={onPrint}
        onSend={onSend}
        onSendSms={onSendSms}
      />
    </div>
  );
}
