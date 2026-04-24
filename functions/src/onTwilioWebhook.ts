import { getFirestore } from "firebase-admin/firestore";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import twilio from "twilio";
import { emailSpeaker, smsSpeaker, type ResolvedInvitation } from "./invitationReplyNotify.js";
import { pushToBishopric } from "./invitationReplyPush.js";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_CONVERSATIONS_SERVICE_SID,
  TWILIO_FROM_NUMBER,
} from "./secrets.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

// SendGrid secrets intentionally omitted — SMS-only v1. emailSpeaker()
// already try/catches a missing-key failure, so the webhook still
// handles speaker replies; it just no-ops on the bishop-reply email
// fan-out until SendGrid is wired.
const WEBHOOK_SECRETS = [
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_CONVERSATIONS_SERVICE_SID,
  TWILIO_FROM_NUMBER,
];

/** Twilio Conversations Service webhook. Wired to this endpoint via
 *  the service's POST-Webhook URL. Fires for every conversation
 *  event; we filter to `onMessageAdded` and fan out:
 *
 *   - `speaker:*` authored → FCM push to active bishopric members
 *   - `uid:*` (bishopric) authored → SMS + email to the speaker,
 *     AND FCM push to other active bishopric members in the ward
 *     (the sender is filtered out)
 *
 *  Post-expiry messages are logged and ignored defensively. */
export const onTwilioWebhook = onRequest(
  { secrets: WEBHOOK_SECRETS },
  async (req, res): Promise<void> => {
    if (!verifySignature(req)) {
      logger.warn("twilio webhook signature verification failed");
      res.status(403).send("forbidden");
      return;
    }
    if (req.body?.EventType !== "onMessageAdded") {
      res.status(200).send("ignored");
      return;
    }

    const conversationSid = req.body.ConversationSid as string;
    const author = (req.body.Author ?? "") as string;
    const body = (req.body.Body ?? "") as string;
    if (!conversationSid || !author) {
      res.status(400).send("missing params");
      return;
    }

    const invitation = await findInvitationByConversation(conversationSid);
    if (!invitation) {
      logger.warn("no invitation for conversation", { conversationSid });
      res.status(200).send("no-match");
      return;
    }
    if (isExpired(invitation)) {
      res.status(200).send("expired");
      return;
    }

    if (author.startsWith("speaker:")) {
      await pushToBishopric(invitation, body);
    } else if (author.startsWith("uid:")) {
      const senderBishopUid = author.slice("uid:".length);
      // All three run in parallel. SMS is the primary channel for the
      // speaker, email is best-effort (no-ops when SendGrid isn't
      // wired), and the bishop-to-bishop push keeps peer bishopric
      // members in the loop without re-notifying the sender.
      await Promise.all([
        smsSpeaker(invitation, body),
        emailSpeaker(invitation, body),
        pushToBishopric(invitation, body, { senderBishopUid }),
      ]);
    }
    res.status(200).send("ok");
  },
);

function verifySignature(req: Request): boolean {
  const sig = req.get("X-Twilio-Signature");
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!sig || !authToken) return false;
  const url = `https://${req.get("host")}${req.originalUrl}`;
  const params = (req.body ?? {}) as Record<string, string>;
  return twilio.validateRequest(authToken, sig, url, params);
}

async function findInvitationByConversation(
  conversationSid: string,
): Promise<ResolvedInvitation | null> {
  const db = getFirestore();
  const q = await db
    .collectionGroup("speakerInvitations")
    .where("conversationSid", "==", conversationSid)
    .limit(1)
    .get();
  if (q.empty) return null;
  const d = q.docs[0]!;
  const wardId = d.ref.path.split("/")[1]!;
  return { ...(d.data() as SpeakerInvitationShape), wardId, token: d.id };
}

function isExpired(inv: SpeakerInvitationShape): boolean {
  if (!inv.expiresAt) return false;
  return inv.expiresAt.toMillis() <= Date.now();
}
