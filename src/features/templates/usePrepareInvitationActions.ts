import { buildMailto } from "@/features/speakers/buildMailto";
import { updateSpeaker } from "@/features/speakers/speakerActions";
import type { SpeakerEmailTemplate } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { renderSpeakerEmailBody } from "./renderSpeakerEmailBody";
import { sendSpeakerInvitation } from "./sendSpeakerInvitation";
import { openSmsInvitation, renderSmsBody } from "./smsInvitation";
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
  emailTemplate: SpeakerEmailTemplate | null;
  /** Called after a terminal action succeeds. Page typically flips to
   *  a "Done" state so the bishop can close the tab. */
  onDone: () => void;
}

/** Wraps Mark invited / Print / Send / SMS with automatic override
 *  persistence + busy/error bookkeeping. Every terminal action
 *  snapshots the editor state onto the speaker doc as an override;
 *  the bishop can undo that by clicking "Revert" in the toolbar,
 *  which clears the override and resets the editor to ward default. */
export function usePrepareInvitationActions(args: Args) {
  const { form } = args;

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

  async function snapshotInvitation(): Promise<string> {
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
    return `${window.location.origin}/invite/speaker/${args.wardId}/${token}`;
  }

  return {
    markInvited: () =>
      void runAction(() =>
        updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" }),
      ),
    send: () =>
      void runAction(async () => {
        const inviteUrl = await snapshotInvitation();
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
    sendSms: () =>
      void runAction(async () => {
        const inviteUrl = await snapshotInvitation();
        openSmsInvitation({
          phone: args.speakerPhone,
          body: renderSmsBody({
            speakerName: args.speakerName,
            date: shortDate(args.date),
            inviteUrl,
          }),
        });
        await updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" });
      }),
  };
}

/** Short-form date for the SMS body ("Apr 26") — the letter preview
 *  uses the long form, but we want one segment (160 chars) on the
 *  text. Returns the raw ISO if it can't parse. */
function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
