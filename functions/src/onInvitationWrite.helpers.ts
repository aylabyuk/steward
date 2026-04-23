import { logger } from "firebase-functions/v2";
import { buildBishopricReceipt, buildSpeakerReceipt } from "./invitationReceiptContent.js";
import { sendEmail } from "./sendgrid/client.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";
import type { MemberDoc } from "./types.js";

export interface BishopricContact {
  uid: string;
  email: string;
  displayName: string;
}

export async function fetchActiveBishopricEmails(
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
    // Bishopric is always CC'd (non-negotiable — bishopric visibility
    // on invitation activity is load-bearing). Clerks and secretaries
    // opt in via `ccOnEmails` (default true for back-compat).
    if (m.role === "clerk" && m.ccOnEmails === false) continue;
    out.push({ uid: d.id, email: m.email, displayName: m.displayName });
  }
  return out;
}

export async function sendSpeakerReceipt(
  invitation: SpeakerInvitationShape,
  bishopric: BishopricContact[],
  headerTemplate: string,
): Promise<void> {
  if (!invitation.speakerEmail) {
    logger.info("speaker receipt skipped — no speakerEmail on invitation", {
      speakerName: invitation.speakerName,
    });
    return;
  }
  const content = buildSpeakerReceipt({ invitation, headerTemplate });
  await sendEmail({
    to: invitation.speakerEmail,
    fromDisplayName: `${invitation.wardName} (via Steward)`,
    subject: content.subject,
    text: content.text,
    html: content.html,
    ...(bishopric.length > 0 ? { cc: bishopric.map((b) => b.email) } : {}),
  });
}

export async function sendBishopricReceipt(
  invitation: SpeakerInvitationShape,
  bishopric: BishopricContact[],
  ctx: { wardId: string; invitationId: string; origin: string; headerTemplate: string },
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
    headerTemplate: ctx.headerTemplate,
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
