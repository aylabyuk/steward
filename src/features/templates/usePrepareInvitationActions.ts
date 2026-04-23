import { updateSpeaker } from "@/features/speakers/speakerActions";
import type { DeliveryEntry } from "@/features/invitations/invitationsCallable";
import { useAuthStore } from "@/stores/authStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { sendSpeakerInvitation } from "./sendSpeakerInvitation";

/** Throws a user-facing error if any requested channel reports
 *  `status: "failed"` in the callable's deliveryRecord. Partial
 *  failures (email ok + SMS failed, or vice-versa) are still raised
 *  — the bishop needs to know which one didn't land. */
function assertChannelsDelivered(
  deliveryRecord: readonly DeliveryEntry[],
  requested: readonly ("email" | "sms")[],
): void {
  const failed = deliveryRecord.filter(
    (e) => requested.includes(e.channel) && e.status === "failed",
  );
  if (failed.length === 0) return;
  const messages = failed.map((e) => {
    const label = e.channel === "email" ? "Email" : "SMS";
    return e.error ? `${label}: ${e.error}` : `${label} delivery failed.`;
  });
  throw new Error(messages.join(" · "));
}

interface FormState {
  letterBody: string;
  letterFooter: string;
  persistOverrides: () => Promise<void>;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
}

interface Args {
  wardId: string;
  date: string;
  speakerId: string;
  speakerName: string;
  speakerEmail: string;
  speakerPhone: string;
  speakerTopic: string;
  inviterName: string;
  form: FormState;
  /** Called after a terminal action succeeds. */
  onDone: () => void;
}

/** Wraps Mark invited / Send (email) / SMS with automatic override
 *  persistence + busy/error bookkeeping. Send / SMS now route through
 *  the `sendSpeakerInvitation` Cloud Function, which handles snapshot
 *  creation, Twilio Conversation setup, and delivery via
 *  SendGrid + Twilio. No more mailto:/sms: hand-offs. */
export function usePrepareInvitationActions(args: Args) {
  const { form } = args;
  const bishopEmail = useAuthStore((s) => s.user?.email ?? "");

  async function runAction(fn: () => Promise<void> | void) {
    form.setBusy(true);
    form.setError(null);
    try {
      await form.persistOverrides();
      await fn();
      args.onDone();
    } catch (e) {
      form.setError(friendlyWriteError(e));
    } finally {
      form.setBusy(false);
    }
  }

  async function sendVia(channels: ("email" | "sms")[]): Promise<void> {
    const res = await sendSpeakerInvitation({
      wardId: args.wardId,
      meetingDate: args.date,
      speakerId: args.speakerId,
      speakerName: args.speakerName,
      ...(args.speakerTopic.trim() ? { speakerTopic: args.speakerTopic.trim() } : {}),
      speakerEmail: args.speakerEmail,
      speakerPhone: args.speakerPhone,
      inviterName: args.inviterName,
      bishopReplyToEmail: bishopEmail,
      bodyMarkdown: form.letterBody,
      footerMarkdown: form.letterFooter,
      channels,
    });
    // The callable returns 200 even when one or more delivery channels
    // fail (the invitation doc + Twilio conversation are still created
    // — rerunning would create duplicates). Surface channel failures
    // here as thrown errors so the bishop sees them in the form error
    // slot instead of a silent "Done" screen.
    assertChannelsDelivered(res.deliveryRecord, channels);
    await updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" });
  }

  return {
    markInvited: () =>
      void runAction(() =>
        updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" }),
      ),
    send: () => void runAction(() => sendVia(["email"])),
    sendSms: () => void runAction(() => sendVia(["sms"])),
  };
}
