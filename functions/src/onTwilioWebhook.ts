import { getFirestore } from "firebase-admin/firestore";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { emailSpeaker, type ResolvedInvitation } from "./invitationReplyNotify.js";
import { pushToBishopric } from "./invitationReplyPush.js";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_CONVERSATIONS_SERVICE_SID,
  TWILIO_FROM_NUMBER,
  TWILIO_WEBHOOK_URL,
} from "./secrets.js";
import { verifyTwilioSignature } from "./twilio/verifyTwilioSignature.js";
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
  TWILIO_WEBHOOK_URL,
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
      // verifyTwilioSignature emits a structured `twilio.webhook.signature_failed`
      // log with a `reason` label — alarm-able via Cloud Logging metric.
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
      // No `smsSpeaker` here: Twilio Conversations natively
      // broadcasts the bishop's message to the speaker's SMS-bound
      // participant. The previous wrapped notification SMS (with a
      // freshly-rotated invite URL) was a duplicate of that native
      // broadcast — speakers were getting both bubbles for the same
      // bishop reply. Email + the bishop-to-bishop FCM push still
      // run in parallel so peers see each other's chat activity even
      // when not actively viewing the thread.
      await Promise.all([
        emailSpeaker(invitation, body),
        pushToBishopric(invitation, body, { senderBishopUid }),
      ]);
    }
    res.status(200).send("ok");
  },
);

function verifySignature(req: Request): boolean {
  // Prefer the pinned `TWILIO_WEBHOOK_URL` when set — eliminates
  // host-header drift as a silent failure mode (e.g. region change,
  // custom-domain swap, unexpected `Host:` header). Falls back to
  // constructing the URL from the request when unset, preserving the
  // prior behaviour for environments that haven't configured pinning.
  const pinnedUrl = process.env.TWILIO_WEBHOOK_URL;
  const url = pinnedUrl ?? `https://${req.get("host")}${req.originalUrl}`;
  return verifyTwilioSignature({
    signature: req.get("X-Twilio-Signature"),
    authToken: process.env.TWILIO_AUTH_TOKEN,
    url,
    params: (req.body ?? {}) as Record<string, string>,
  });
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
