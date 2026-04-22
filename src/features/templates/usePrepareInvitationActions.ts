import { updateSpeaker } from "@/features/speakers/speakerActions";
import { useAuthStore } from "@/stores/authStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { sendSpeakerInvitation } from "./sendSpeakerInvitation";
import type { LetterVars } from "./prepareInvitationVars";

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
  vars: LetterVars;
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
    await sendSpeakerInvitation({
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
