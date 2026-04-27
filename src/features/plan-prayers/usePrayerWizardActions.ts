import { useState } from "react";
import type { PrayerRole } from "@/lib/types";
import {
  callRotateInvitationLink,
  type DeliveryEntry,
} from "@/features/invitations/utils/invitationsCallable";
import { upsertPrayerParticipant } from "@/features/prayers/prayerActions";
import { sendPrayerInvitation } from "@/features/prayers/sendPrayerInvitation";
import { isPlausiblePhone } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { friendlyWriteError } from "@/stores/saveStatusStore";

interface FreshArgs {
  wardId: string;
  date: string;
  role: PrayerRole;
  prayerGiverName: string;
  prayerGiverEmail: string;
  prayerGiverPhone: string;
  inviterName: string;
  bishopReplyToEmail: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  editorStateJson?: string | undefined;
}

/** Mirror of `useWizardActions` for prayer-givers. Wraps sendFresh /
 *  resend / markInvited with shared busy/error state and routes
 *  status writes through `upsertPrayerParticipant` (vs `updateSpeaker`). */
export function usePrayerWizardActions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function withBusy<T>(fn: () => Promise<T>): Promise<T | null> {
    setBusy(true);
    setError(null);
    try {
      return await fn();
    } catch (e) {
      setError(friendlyWriteError(e));
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function sendFresh(a: FreshArgs): Promise<boolean> {
    const channels = activeChannels(a.prayerGiverEmail, a.prayerGiverPhone);
    if (channels.length === 0) {
      setError("Add an email or phone before sending.");
      return false;
    }
    const result = await withBusy(async () => {
      const res = await sendPrayerInvitation({
        wardId: a.wardId,
        meetingDate: a.date,
        role: a.role,
        prayerGiverName: a.prayerGiverName,
        prayerGiverEmail: a.prayerGiverEmail,
        prayerGiverPhone: a.prayerGiverPhone,
        inviterName: a.inviterName,
        bishopReplyToEmail: a.bishopReplyToEmail,
        bodyMarkdown: a.bodyMarkdown,
        footerMarkdown: a.footerMarkdown,
        ...(a.editorStateJson ? { editorStateJson: a.editorStateJson } : {}),
        channels,
      });
      assertDelivered(res.deliveryRecord, channels);
      await upsertPrayerParticipant(a.wardId, a.date, a.role, { status: "invited" });
      return true;
    });
    return result === true;
  }

  async function resend(args: {
    wardId: string;
    invitationId: string;
    email: string;
    phone: string;
  }): Promise<boolean> {
    const channels = activeChannels(args.email, args.phone);
    if (channels.length === 0) {
      setError("No email or phone to resend to.");
      return false;
    }
    const result = await withBusy(async () => {
      const res = await callRotateInvitationLink({
        mode: "rotate",
        wardId: args.wardId,
        invitationId: args.invitationId,
        channels,
      });
      assertDelivered(res.deliveryRecord, channels);
      return true;
    });
    return result === true;
  }

  async function markInvited(args: {
    wardId: string;
    date: string;
    role: PrayerRole;
  }): Promise<boolean> {
    const result = await withBusy(async () => {
      await upsertPrayerParticipant(args.wardId, args.date, args.role, { status: "invited" });
      return true;
    });
    return result === true;
  }

  return { busy, error, setError, sendFresh, resend, markInvited };
}

function activeChannels(email: string, phone: string): ("email" | "sms")[] {
  const channels: ("email" | "sms")[] = [];
  if (isValidEmail(email.trim())) channels.push("email");
  if (isPlausiblePhone(phone.trim())) channels.push("sms");
  return channels;
}

function assertDelivered(
  record: readonly DeliveryEntry[],
  requested: readonly ("email" | "sms")[],
): void {
  const failed = record.filter((e) => requested.includes(e.channel) && e.status === "failed");
  if (failed.length === 0) return;
  const messages = failed.map((e) => {
    const label = e.channel === "email" ? "Email" : "SMS";
    return e.error ? `${label}: ${e.error}` : `${label} delivery failed.`;
  });
  throw new Error(messages.join(" · "));
}
