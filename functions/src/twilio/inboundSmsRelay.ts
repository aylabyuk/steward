import { type Firestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { postMessage } from "./conversations.js";
import { AUTH_DOC_ID } from "../invitationDocs.js";
import type { SpeakerInvitationAuthShape, SpeakerInvitationShape } from "../invitationTypes.js";

export type RelayResult =
  | { matched: true; conversationSid: string; invitationId: string; messageSid: string }
  | { matched: false; reason: "no-active-invitation" | "no-conversation" | "empty-body" };

/** Server-side bridge for inbound SMS from a speaker's phone. Looks up
 *  the most recent active invitation for the sender phone and posts
 *  the SMS body into that conversation as `speaker:{invitationId}`,
 *  so the bishop sees a normal speaker-authored chat message and the
 *  rest of the existing webhook fan-out (FCM push to bishopric) runs
 *  unchanged.
 *
 *  Why this exists: we removed the SMS-only Conversations participant
 *  for the speaker (see #227) to avoid Twilio's chat → SMS auto-bridge
 *  echoing the speaker's own web-side replies back to their phone.
 *  With no SMS participant, inbound SMS has nowhere to land natively;
 *  this relay restores the inbound path server-side.
 *
 *  Match rule: any speakerInvitation whose `speakerPhone` equals the
 *  inbound `From`, `tokenStatus === "active"`, and `expiresAt` in the
 *  future — most recent wins. Tie-break is `createdAt` descending so a
 *  shared phone (e.g. spouses) routes to the most-recently-sent
 *  invitation. Returns `matched: false` so the caller can respond with
 *  a TwiML auto-reply for genuinely unknown senders. */
export async function relayInboundSms(
  db: Firestore,
  from: string,
  body: string,
): Promise<RelayResult> {
  const trimmed = body.trim();
  if (!trimmed) return { matched: false, reason: "empty-body" };

  // C1 doc-split: `speakerPhone` + `tokenStatus` live on the auth
  // subdoc at `…/private/{AUTH_DOC_ID}`. Query the auth subcollection
  // group and join back to each parent (for `expiresAt`, `createdAt`,
  // `conversationSid`) in code. Filter to docs whose id matches the
  // auth doc id so we don't pick up unrelated `private` subcollections
  // that may exist elsewhere in the codebase later.
  const authSnap = await db
    .collectionGroup("private")
    .where("speakerPhone", "==", from)
    .where("tokenStatus", "==", "active")
    .get();
  if (authSnap.empty) return { matched: false, reason: "no-active-invitation" };

  const now = Date.now();
  const parentReads = await Promise.all(
    authSnap.docs
      .filter((d) => d.id === AUTH_DOC_ID)
      .map(async (authDoc) => {
        const parentRef = authDoc.ref.parent.parent;
        if (!parentRef) return null;
        const parentSnap = await parentRef.get();
        if (!parentSnap.exists) return null;
        const parentData = parentSnap.data() as SpeakerInvitationShape;
        const authData = authDoc.data() as SpeakerInvitationAuthShape;
        return { parentSnap, parentData, authData };
      }),
  );
  const candidates = parentReads
    .filter((c): c is NonNullable<typeof c> => c !== null)
    .filter(({ parentData }) => !parentData.expiresAt || parentData.expiresAt.toMillis() > now)
    .toSorted((a, b) => {
      // Sort descending by createdAt (most recent first). Server-
      // stamped FieldValue isn't typed on SpeakerInvitationShape, so
      // read through the raw doc data.
      const aMs =
        (a.parentData as { createdAt?: FirebaseFirestore.Timestamp }).createdAt?.toMillis() ?? 0;
      const bMs =
        (b.parentData as { createdAt?: FirebaseFirestore.Timestamp }).createdAt?.toMillis() ?? 0;
      return bMs - aMs;
    });
  if (candidates.length === 0) return { matched: false, reason: "no-active-invitation" };

  const winner = candidates[0]!;
  const conversationSid = winner.parentData.conversationSid;
  if (!conversationSid) {
    logger.warn("matched invitation has no conversationSid", {
      invitationId: winner.parentSnap.id,
    });
    return { matched: false, reason: "no-conversation" };
  }
  const invitationId = winner.parentSnap.id;
  const messageSid = await postMessage({
    conversationSid,
    author: `speaker:${invitationId}`,
    body: trimmed,
  });
  return { matched: true, conversationSid, invitationId, messageSid };
}

/** Static TwiML response body for the no-match case — used by the
 *  webhook caller to politely respond to inbound SMS from a phone we
 *  don't recognize. Uses Twilio's `<Response><Message>` shape. */
export const NO_MATCH_TWIML = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Message>This number doesn't recognize your phone. Please contact your ward bishopric directly.</Message>
</Response>`;
