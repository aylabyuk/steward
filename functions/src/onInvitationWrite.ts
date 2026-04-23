import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { buildBishopricReceipt, buildSpeakerReceipt } from "./invitationReceiptContent.js";
import { classifyInvitationChange } from "./invitationChange.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import { sendEmail } from "./sendgrid/client.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type { MemberDoc } from "./types.js";

/** Fires receipt emails on authoritative response transitions:
 *   - `response.answer` appears → speaker receipt (to speaker, CC bishopric)
 *   - `response.acknowledgedAt` appears → bishopric receipt (to bishopric)
 *
 *  Other writes (token rotation, delivery-record updates, heartbeats)
 *  are classified as no-ops and return early. The receipts contain the
 *  original letter inline so the email itself is the archive — no
 *  external dependency on the invite URL or the app being reachable. */
export const onInvitationWrite = onDocumentWritten(
  "wards/{wardId}/speakerInvitations/{invitationId}",
  async (event) => {
    const before = event.data?.before.data() as SpeakerInvitationShape | undefined;
    const after = event.data?.after.data() as SpeakerInvitationShape | undefined;
    const change = classifyInvitationChange(before, after);
    if (!change.fireSpeaker && !change.fireBishopric) return;
    if (!after) return;

    const { wardId, invitationId } = event.params;
    const db = getFirestore();
    try {
      const bishopric = await fetchActiveBishopricEmails(db, wardId);
      if (change.fireSpeaker) {
        await sendSpeakerReceipt(after, bishopric);
      }
      if (change.fireBishopric) {
        const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
        await sendBishopricReceipt(after, bishopric, { wardId, invitationId, origin });
      }
    } catch (err) {
      logger.error("invitation receipt dispatch failed", {
        wardId,
        invitationId,
        err: (err as Error).message,
      });
    }
  },
);

interface BishopricContact {
  uid: string;
  email: string;
  displayName: string;
}

async function fetchActiveBishopricEmails(
  db: FirebaseFirestore.Firestore,
  wardId: string,
): Promise<BishopricContact[]> {
  const snap = await db.collection(`wards/${wardId}/members`).get();
  const out: BishopricContact[] = [];
  for (const d of snap.docs) {
    const m = d.data() as MemberDoc;
    if (!m.active) continue;
    if (m.role !== "bishopric" && m.role !== "clerk") continue;
    if (!m.email) continue;
    out.push({ uid: d.id, email: m.email, displayName: m.displayName });
  }
  return out;
}

async function sendSpeakerReceipt(
  invitation: SpeakerInvitationShape,
  bishopric: BishopricContact[],
): Promise<void> {
  if (!invitation.speakerEmail) {
    logger.info("speaker receipt skipped — no speakerEmail on invitation", {
      speakerName: invitation.speakerName,
    });
    return;
  }
  const content = buildSpeakerReceipt({ invitation });
  await sendEmail({
    to: invitation.speakerEmail,
    fromDisplayName: `${invitation.wardName} (via Steward)`,
    subject: content.subject,
    text: content.text,
    html: content.html,
    ...(bishopric.length > 0 ? { cc: bishopric.map((b) => b.email) } : {}),
  });
}

async function sendBishopricReceipt(
  invitation: SpeakerInvitationShape,
  bishopric: BishopricContact[],
  ctx: { wardId: string; invitationId: string; origin: string },
): Promise<void> {
  if (bishopric.length === 0) {
    logger.warn("bishopric receipt skipped — no bishopric emails found", { wardId: ctx.wardId });
    return;
  }
  const acknowledgedByName = bishopric.find(
    (b) => b.uid === invitation.response?.acknowledgedBy,
  )?.displayName;
  const respondedAt = invitation.response?.respondedAt?.toDate();
  const origin = ctx.origin.replace(/\/+$/, "");
  const bishopricViewUrl = `${origin}/ward/${ctx.wardId}/invitations/${ctx.invitationId}/view`;
  const content = buildBishopricReceipt({
    invitation,
    bishopricViewUrl,
    acknowledgedByName,
    respondedAt,
  });
  // Send individually rather than via CC: the bishopric list can be 3-7
  // people and individual sends give SendGrid cleaner bounce handling
  // per recipient.
  await Promise.all(
    bishopric.map((b) =>
      sendEmail({
        to: b.email,
        fromDisplayName: `Steward`,
        subject: content.subject,
        text: content.text,
        html: content.html,
      }),
    ),
  );
}
