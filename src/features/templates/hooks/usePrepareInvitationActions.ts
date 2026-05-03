import { updateSpeaker } from "@/features/speakers/utils/speakerActions";
import type { DeliveryEntry } from "@/features/invitations/utils/invitationsCallable";
import { useAuthStore } from "@/stores/authStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { sendSpeakerInvitation } from "../utils/sendSpeakerInvitation";

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
  /** WYSIWYG state JSON, when the bishop has authored a Lexical
   *  template. Forwarded to the snapshot so the speaker landing page
   *  can render the bishop's exact letterhead / signature / callouts
   *  instead of the legacy chrome + flat markdown. */
  letterStateJson: string | null;
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

  async function sendVia(
    channels: ("email" | "sms")[],
    contactOverride?: { email?: string; phone?: string },
  ): Promise<void> {
    // Refuse to send before the editor has hydrated its initial state.
    // Without `letterStateJson` the snapshot is written without
    // `editorStateJson` and the speaker's landing page falls back to
    // the legacy chrome — losing any letterhead / signature / callout
    // edits. Practically this is a microsecond-wide race after page
    // load; the guard is belt-and-braces.
    if (form.letterStateJson === null) {
      throw new Error("Letter is still loading — please wait a moment and try again.");
    }
    // Persist a changed contact value before the send so the speaker
    // doc stays the single source of truth. The callable receives the
    // resolved (override ?? current) value directly to avoid racing
    // against the Firestore subscription re-snapshotting our props.
    const resolvedEmail = (contactOverride?.email ?? args.speakerEmail).trim();
    const resolvedPhone = (contactOverride?.phone ?? args.speakerPhone).trim();
    const contactPatch: { email?: string; phone?: string } = {};
    if (contactOverride?.email && resolvedEmail !== args.speakerEmail.trim()) {
      contactPatch.email = resolvedEmail;
    }
    if (contactOverride?.phone && resolvedPhone !== args.speakerPhone.trim()) {
      contactPatch.phone = resolvedPhone;
    }
    if (contactPatch.email || contactPatch.phone) {
      await updateSpeaker(args.wardId, args.date, args.speakerId, contactPatch);
    }
    const res = await sendSpeakerInvitation({
      wardId: args.wardId,
      meetingDate: args.date,
      speakerId: args.speakerId,
      speakerName: args.speakerName,
      ...(args.speakerTopic.trim() ? { speakerTopic: args.speakerTopic.trim() } : {}),
      speakerEmail: resolvedEmail,
      speakerPhone: resolvedPhone,
      inviterName: args.inviterName,
      bishopReplyToEmail: bishopEmail,
      bodyMarkdown: form.letterBody,
      footerMarkdown: form.letterFooter,
      ...(form.letterStateJson ? { editorStateJson: form.letterStateJson } : {}),
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

  /** Save the in-flight letter as a per-speaker override without
   *  triggering a send. Surfaces busy/error through the same form
   *  channels as Send so the toolbar disables consistently. */
  async function save(): Promise<void> {
    form.setBusy(true);
    form.setError(null);
    try {
      await form.persistOverrides();
    } catch (e) {
      form.setError(friendlyWriteError(e));
      throw e;
    } finally {
      form.setBusy(false);
    }
  }

  return {
    markInvited: () =>
      void runAction(() =>
        updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" }),
      ),
    send: (email?: string) =>
      void runAction(() => sendVia(["email"], email ? { email } : undefined)),
    sendSms: (phone?: string) =>
      void runAction(() => sendVia(["sms"], phone ? { phone } : undefined)),
    save,
  };
}
