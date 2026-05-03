import type { PrayerRole } from "@/lib/types";
import type { DeliveryEntry } from "@/features/invitations/utils/invitationsCallable";
import { useAuthStore } from "@/stores/authStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { upsertPrayerParticipant } from "../utils/prayerActions";
import { sendPrayerInvitation } from "../utils/sendPrayerInvitation";

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
  letterStateJson: string | null;
  persistOverrides: () => Promise<void>;
  setBusy: (b: boolean) => void;
  setError: (e: string | null) => void;
}

interface Args {
  wardId: string;
  date: string;
  role: PrayerRole;
  prayerGiverName: string;
  prayerGiverEmail: string;
  prayerGiverPhone: string;
  inviterName: string;
  form: FormState;
  onDone: () => void;
}

/** Mirror of `usePrepareInvitationActions` for prayer-givers. Wraps
 *  Mark invited / Send (email) / Send SMS with override persistence
 *  + busy/error bookkeeping. Send routes through
 *  `sendPrayerInvitation` (which calls the unified CF with
 *  `kind: "prayer"`), then upserts the prayer participant doc with
 *  `status: "invited"`. */
export function usePreparePrayerActions(args: Args) {
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
    // `editorStateJson` and the prayer-giver's landing page falls back
    // to the legacy chrome — losing any letterhead / signature /
    // callout edits. Mirrors the speaker-side guard.
    if (form.letterStateJson === null) {
      throw new Error("Letter is still loading — please wait a moment and try again.");
    }
    const resolvedEmail = (contactOverride?.email ?? args.prayerGiverEmail).trim();
    const resolvedPhone = (contactOverride?.phone ?? args.prayerGiverPhone).trim();
    const patch: { email?: string; phone?: string } = {};
    if (contactOverride?.email && resolvedEmail !== args.prayerGiverEmail.trim()) {
      patch.email = resolvedEmail;
    }
    if (contactOverride?.phone && resolvedPhone !== args.prayerGiverPhone.trim()) {
      patch.phone = resolvedPhone;
    }
    if (patch.email || patch.phone) {
      await upsertPrayerParticipant(args.wardId, args.date, args.role, {
        name: args.prayerGiverName,
        ...patch,
      });
    }
    const res = await sendPrayerInvitation({
      wardId: args.wardId,
      meetingDate: args.date,
      role: args.role,
      prayerGiverName: args.prayerGiverName,
      prayerGiverEmail: resolvedEmail,
      prayerGiverPhone: resolvedPhone,
      inviterName: args.inviterName,
      bishopReplyToEmail: bishopEmail,
      bodyMarkdown: form.letterBody,
      footerMarkdown: form.letterFooter,
      ...(form.letterStateJson ? { editorStateJson: form.letterStateJson } : {}),
      channels,
    });
    assertChannelsDelivered(res.deliveryRecord, channels);
    await upsertPrayerParticipant(args.wardId, args.date, args.role, {
      name: args.prayerGiverName,
      status: "invited",
    });
  }

  /** Persist the in-flight letter as a per-prayer-giver override
   *  without triggering a send. Mirrors the speaker-side `save`. */
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
        upsertPrayerParticipant(args.wardId, args.date, args.role, {
          name: args.prayerGiverName,
          status: "invited",
        }),
      ),
    send: (email?: string) =>
      void runAction(() => sendVia(["email"], email ? { email } : undefined)),
    sendSms: (phone?: string) =>
      void runAction(() => sendVia(["sms"], phone ? { phone } : undefined)),
    save,
  };
}
