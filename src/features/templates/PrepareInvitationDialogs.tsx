import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SendChannelDialog } from "./SendChannelDialog";

type PendingConfirm = "revert" | null;
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
  onSend: (email: string) => void;
  onSendSms: (phone: string) => void;
}

/** Extracts the confirm / send-channel dialogs that the Prepare
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
