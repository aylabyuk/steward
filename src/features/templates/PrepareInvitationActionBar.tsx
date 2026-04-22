import { useState } from "react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CheckIcon, PrintIcon, SendIcon } from "@/features/schedule/SpeakerInviteIcons";
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
  onRevert: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
  onSend: () => void;
  onSendSms: () => void;
}

type PendingConfirm = "revert" | "markInvited" | "send" | "sms" | null;

/** Top-of-page action toolbar for the Prepare Invitation page.
 *  Icon-only buttons in a connected group — labels travel via `title`
 *  (desktop tooltip) and `aria-label` (screen readers). Destructive /
 *  silent-state-change / side-effecting actions (Revert, Mark invited
 *  only, Send email, Send SMS) gate on a confirm modal so an accidental
 *  tap doesn't flip status, wipe an override, or fire a live mailto /
 *  Messages handoff. Cancel lives on the page chrome, not in this
 *  toolbar. */
export function PrepareInvitationActionBar({
  busy,
  canSend,
  canSendReason,
  canSms,
  canSmsReason,
  hasOverride,
  speakerName,
  onRevert,
  onMarkInvited,
  onPrint,
  onSend,
  onSendSms,
}: Props) {
  const [pending, setPending] = useState<PendingConfirm>(null);

  function confirm<T>(run: () => T) {
    setPending(null);
    run();
  }

  const hint = canSendReason ?? canSmsReason;

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
        <GroupBtn position="mid" label="Print letter" onClick={onPrint} disabled={busy}>
          <PrintIcon />
        </GroupBtn>
        <GroupBtn
          position="mid"
          label="Send SMS"
          onClick={() => setPending("sms")}
          disabled={busy || !canSms}
        >
          <SmsIcon />
        </GroupBtn>
        <GroupBtn
          position="last"
          label="Send email"
          onClick={() => setPending("send")}
          disabled={busy || !canSend}
          primary
        >
          <SendIcon />
        </GroupBtn>
      </div>
      {hint && (
        <span className="font-serif italic text-[11px] sm:text-[11.5px] text-walnut-3">{hint}</span>
      )}

      <ConfirmDialog
        open={pending === "revert"}
        title={hasOverride ? "Clear per-speaker override?" : "Revert to ward default?"}
        body={
          hasOverride
            ? `This deletes ${speakerName}'s saved letter override and restores the ward default. Any unsaved edits in the editor are also discarded.`
            : "This resets the editor to the ward default template. Any unsaved edits in the editor are discarded."
        }
        confirmLabel={hasOverride ? "Clear override" : "Revert"}
        danger={hasOverride}
        onConfirm={() => confirm(onRevert)}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "markInvited"}
        title="Mark as invited without sending?"
        body={`${speakerName}'s status will be set to "invited" — no email is sent. Use this if you've already reached them another way (phone, in person, separate email).`}
        confirmLabel="Mark invited"
        onConfirm={() => confirm(onMarkInvited)}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "send"}
        title={`Send invitation to ${speakerName}?`}
        body="This snapshots the letter into a new invitation link, opens your email client with the message pre-filled, and marks the speaker as invited. You'll still review the message in your email client before hitting send there."
        confirmLabel="Open email"
        onConfirm={() => confirm(onSend)}
        onCancel={() => setPending(null)}
      />
      <ConfirmDialog
        open={pending === "sms"}
        title={`Text invitation to ${speakerName}?`}
        body="This snapshots the letter into a new invitation link, opens your phone's Messages app with a short text pre-filled, and marks the speaker as invited. You'll still review the message in Messages before hitting send there."
        confirmLabel="Open Messages"
        onConfirm={() => confirm(onSendSms)}
        onCancel={() => setPending(null)}
      />
    </div>
  );
}
