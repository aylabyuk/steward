import { useState } from "react";
import { updateSpeaker } from "@/features/speakers/speakerActions";
import { sendSpeakerInvitation } from "@/features/templates/sendSpeakerInvitation";
import {
  callRotateInvitationLink,
  type DeliveryEntry,
} from "@/features/invitations/invitationsCallable";
import { isPlausiblePhone } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { friendlyWriteError } from "@/stores/saveStatusStore";

interface FreshArgs {
  wardId: string;
  date: string;
  speakerId: string;
  speakerName: string;
  speakerTopic?: string | undefined;
  speakerEmail: string;
  speakerPhone: string;
  inviterName: string;
  bishopReplyToEmail: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  /** WYSIWYG-authored Lexical state. Optional fallback to the derived
   *  markdown for legacy templates that have only the markdown fields. */
  editorStateJson?: string | undefined;
}

/** Wraps the three terminal wizard actions: fresh send, rotate (resend),
 *  and mark-invited-after-print. Returns busy/error state plus the
 *  three handlers. Each handler resolves on success and throws-internally
 *  (caught + surfaced via `error`) on failure so callers don't have to
 *  manage their own try/catch. */
export function useWizardActions() {
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
    const channels = activeChannels(a.speakerEmail, a.speakerPhone);
    if (channels.length === 0) {
      setError("Add an email or phone before sending.");
      return false;
    }
    const result = await withBusy(async () => {
      const res = await sendSpeakerInvitation({
        wardId: a.wardId,
        meetingDate: a.date,
        speakerId: a.speakerId,
        speakerName: a.speakerName,
        ...(a.speakerTopic ? { speakerTopic: a.speakerTopic } : {}),
        speakerEmail: a.speakerEmail,
        speakerPhone: a.speakerPhone,
        inviterName: a.inviterName,
        bishopReplyToEmail: a.bishopReplyToEmail,
        bodyMarkdown: a.bodyMarkdown,
        footerMarkdown: a.footerMarkdown,
        ...(a.editorStateJson ? { editorStateJson: a.editorStateJson } : {}),
        channels,
      });
      assertDelivered(res.deliveryRecord, channels);
      await updateSpeaker(a.wardId, a.date, a.speakerId, { status: "invited" });
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
    speakerId: string;
  }): Promise<boolean> {
    const result = await withBusy(async () => {
      await updateSpeaker(args.wardId, args.date, args.speakerId, { status: "invited" });
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
