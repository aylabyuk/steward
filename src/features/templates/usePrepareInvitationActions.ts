import { buildMailto } from "@/features/speakers/buildMailto";
import { updateSpeaker } from "@/features/speakers/speakerActions";
import type { SpeakerEmailTemplate } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { renderSpeakerEmailBody } from "./renderSpeakerEmailBody";
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
  speakerTopic: string;
  inviterName: string;
  vars: LetterVars;
  saveAsOverride: boolean;
  form: FormState;
  emailTemplate: SpeakerEmailTemplate | null;
  /** Called after a terminal action succeeds. Page typically flips to
   *  a "Done" state so the bishop can close the tab. */
  onDone: () => void;
}

/** Wraps Mark invited / Print / Send with optional "save as override"
 *  persistence + busy/error bookkeeping. Used by the standalone
 *  `/week/:date/speaker/:id/prepare` page — status flips and sends go
 *  straight to Firestore here; the parent draft-state callback path
 *  is gone because the page runs in its own tab. */
export function usePrepareInvitationActions(args: Args) {
  const { form, saveAsOverride } = args;

  async function runAction(fn: () => Promise<void> | void) {
    form.setBusy(true);
    form.setError(null);
    try {
      if (saveAsOverride) await form.persistOverrides();
      await fn();
      args.onDone();
    } catch (e) {
      form.setError(friendlyWriteError(e));
    } finally {
      form.setBusy(false);
    }
  }

  return {
    markInvited: () =>
      void runAction(() =>
        updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" }),
      ),
    send: () =>
      void runAction(async () => {
        const { token } = await sendSpeakerInvitation({
          wardId: args.wardId,
          meetingDate: args.date,
          speakerId: args.speakerId,
          speakerName: args.speakerName,
          speakerTopic: args.speakerTopic.trim() || undefined,
          inviterName: args.inviterName,
          bodyMarkdown: form.letterBody,
          footerMarkdown: form.letterFooter,
        });
        const inviteUrl = `${window.location.origin}/invite/speaker/${args.wardId}/${token}`;
        const body = renderSpeakerEmailBody(
          { ...args.vars, inviteUrl },
          { template: args.emailTemplate?.bodyMarkdown },
        );
        window.location.href = buildMailto({
          to: args.speakerEmail.trim(),
          cc: [],
          subject: `Invitation to speak — ${args.vars.date}`,
          body,
        });
        await updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" });
      }),
  };
}
