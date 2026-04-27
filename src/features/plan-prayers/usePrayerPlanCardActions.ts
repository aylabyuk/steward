import { useState } from "react";
import type { PrayerRole } from "@/lib/types";
import { upsertPrayerParticipant } from "@/features/prayers/prayerActions";
import { sendPrayerInvitation } from "@/features/prayers/sendPrayerInvitation";
import { friendlyWriteError } from "@/stores/saveStatusStore";

interface Args {
  wardId: string;
  date: string;
  role: PrayerRole;
  inviterName: string;
  bishopEmail: string;
  /** Live form values from the card. */
  name: string;
  email: string;
  phone: string;
}

/** Plan-prayers card action layer. Wraps the contact upsert,
 *  send-invitation call, and mark-invited path with shared
 *  busy/error state so the card stays a thin presentation
 *  component. */
export function usePrayerPlanCardActions(args: Args) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persistContact() {
    await upsertPrayerParticipant(args.wardId, args.date, args.role, {
      name: args.name.trim(),
      email: args.email.trim(),
      phone: args.phone.trim(),
    });
  }

  async function send(channels: ("email" | "sms")[]) {
    if (!args.name.trim() || channels.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      await persistContact();
      await sendPrayerInvitation({
        wardId: args.wardId,
        meetingDate: args.date,
        role: args.role,
        prayerGiverName: args.name.trim(),
        prayerGiverEmail: args.email.trim(),
        prayerGiverPhone: args.phone.trim(),
        inviterName: args.inviterName,
        bishopReplyToEmail: args.bishopEmail,
        bodyMarkdown: "",
        footerMarkdown: "",
        channels,
      });
      await upsertPrayerParticipant(args.wardId, args.date, args.role, { status: "invited" });
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setBusy(false);
    }
  }

  async function markInvited() {
    if (!args.name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await persistContact();
      await upsertPrayerParticipant(args.wardId, args.date, args.role, { status: "invited" });
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, send, markInvited };
}
