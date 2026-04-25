import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SendChannelDialog } from "./SendChannelDialog";

type PendingConfirm = "revert" | "markInvited" | "printAndMarkInvited" | null;
type PendingSend = "email" | "sms" | null;

interface Props {
  pending: PendingConfirm;
  pendingSend: PendingSend;
  busy: boolean;
  hasOverride: boolean;
  speakerName: string;
  speakerEmail: string;
  speakerPhone: string;
  onCancelPending: () => void;
  onCancelPendingSend: () => void;
  onRevert: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
  onSend: (email: string) => void;
  onSendSms: (phone: string) => void;
}

/** Extracts the five confirm / send-channel dialogs that the Prepare
 *  Invitation action bar renders. Keeps the action bar focused on
 *  button layout + state and under the 150-LOC file cap. */
export function PrepareInvitationDialogs({
  pending,
  pendingSend,
  busy,
  hasOverride,
  speakerName,
  speakerEmail,
  speakerPhone,
  onCancelPending,
  onCancelPendingSend,
  onRevert,
  onMarkInvited,
  onPrint,
  onSend,
  onSendSms,
}: Props) {
  return (
    <>
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
        onConfirm={() => {
          onCancelPending();
          onRevert();
        }}
        onCancel={onCancelPending}
      />
      <ConfirmDialog
        open={pending === "markInvited"}
        title="Mark as invited without sending?"
        body={`${speakerName}'s status will be set to "invited" — no email is sent. Use this if you've already reached them another way (phone, in person, separate email).`}
        confirmLabel="Mark invited"
        onConfirm={() => {
          onCancelPending();
          onMarkInvited();
        }}
        onCancel={onCancelPending}
      />
      <ConfirmDialog
        open={pending === "printAndMarkInvited"}
        title="Print letter and mark as invited?"
        body={`${speakerName} has no phone or email on file, so printing the letter is how you'll hand off this invitation. We'll open the print dialog now and set their status to "invited" so the schedule reflects that you've delivered it.`}
        confirmLabel="Print & mark invited"
        onConfirm={() => {
          onCancelPending();
          onPrint();
          onMarkInvited();
        }}
        onCancel={onCancelPending}
      />
      <SendChannelDialog
        open={pendingSend === "email"}
        channel="email"
        speakerName={speakerName}
        currentValue={speakerEmail}
        busy={busy}
        onCancel={onCancelPendingSend}
        onConfirm={(email) => {
          onCancelPendingSend();
          onSend(email);
        }}
      />
      <SendChannelDialog
        open={pendingSend === "sms"}
        channel="sms"
        speakerName={speakerName}
        currentValue={speakerPhone}
        busy={busy}
        onCancel={onCancelPendingSend}
        onConfirm={(phone) => {
          onCancelPendingSend();
          onSendSms(phone);
        }}
      />
    </>
  );
}
