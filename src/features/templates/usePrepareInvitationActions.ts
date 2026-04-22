import { buildMailto } from "@/features/speakers/buildMailto";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { renderSpeakerEmailBody } from "./renderSpeakerEmailBody";
import { sendSpeakerInvitation } from "./sendSpeakerInvitation";
import type { LetterVars } from "./prepareInvitationVars";

interface FormState {
  letterBody: string;
  letterFooter: string;
  emailBody: string;
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
  onClose: () => void;
  onMarkInvited: () => void;
  onPrint: () => void;
}

/** Wraps the three terminal actions (Mark invited / Print / Send) with
 *  optional "save as override" persistence + busy/error bookkeeping,
 *  so `PrepareInvitationDialog` only has to wire them to buttons. */
export function usePrepareInvitationActions(args: Args) {
  const { form, saveAsOverride } = args;

  async function runAction(fn: () => Promise<void> | void) {
    form.setBusy(true);
    form.setError(null);
    try {
      if (saveAsOverride) await form.persistOverrides();
      await fn();
      args.onClose();
    } catch (e) {
      form.setError(friendlyWriteError(e));
    } finally {
      form.setBusy(false);
    }
  }

  return {
    markInvited: () => void runAction(() => args.onMarkInvited()),
    print: () => void runAction(() => args.onPrint()),
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
          { override: form.emailBody, template: null },
        );
        window.location.href = buildMailto({
          to: args.speakerEmail.trim(),
          cc: [],
          subject: `Invitation to speak — ${args.vars.date}`,
          body,
        });
        args.onMarkInvited();
      }),
  };
}
