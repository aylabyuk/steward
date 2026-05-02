import { getFirestore } from "firebase-admin/firestore";
import { onRequest, type Request } from "firebase-functions/v2/https";
import { logger } from "firebase-functions/v2";
import { loadMergedInvitationByConversation } from "./invitationDocs.js";
import { emailSpeaker, smsSpeaker, type ResolvedInvitation } from "./invitationReplyNotify.js";
import { pushToBishopric } from "./invitationReplyPush.js";
import {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_CONVERSATIONS_SERVICE_SID,
  TWILIO_FROM_NUMBER,
  TWILIO_WEBHOOK_URL,
} from "./secrets.js";
import { NO_MATCH_TWIML, relayInboundSms } from "./twilio/inboundSmsRelay.js";
import { verifyTwilioSignature } from "./twilio/verifyTwilioSignature.js";

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

/** Twilio webhook endpoint — handles two kinds of inbound:
 *
 *  1. **Conversations Service post-webhook** (payload has `EventType`).
 *     Fires on every conversation event; we filter to `onMessageAdded`
 *     and fan out:
 *      - `speaker:*` authored → FCM push to active bishopric members
 *      - `uid:*` (bishopric) authored → SMS + email to the speaker,
 *        AND FCM push to other active bishopric members in the ward
 *        (the sender is filtered out)
 *
 *  2. **Programmable Messaging inbound webhook** (payload has
 *     `MessageSid` + `From` + `Body`, no `EventType`). Wired via the
 *     messaging service's `inboundRequestUrl`. Routes the SMS body
 *     into the matching active speaker invitation's conversation as
 *     `speaker:{invitationId}` so the bishop sees a normal speaker
 *     chat message — see [twilio/inboundSmsRelay.ts]. Replaces the
 *     deleted SMS-only Conversations participant pattern (#227).
 *
 *  Post-expiry messages on the Conversations branch are logged and
 *  ignored defensively. */
export const onTwilioWebhook = onRequest(
  { secrets: WEBHOOK_SECRETS },
  async (req, res): Promise<void> => {
    if (!verifySignature(req)) {
      // verifyTwilioSignature emits a structured `twilio.webhook.signature_failed`
      // log with a `reason` label — alarm-able via Cloud Logging metric.
      res.status(403).send("forbidden");
      return;
    }

    if (isInboundSmsPayload(req)) {
      const twiml = await handleInboundSms(req);
      res.set("Content-Type", "text/xml").status(200).send(twiml);
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

/** Programmable Messaging inbound payloads carry `MessageSid` + `From`
 *  + `Body`, with no `EventType` (that field is Conversations-only).
 *  Distinguishing on payload shape lets a single endpoint serve both
 *  Twilio webhook formats without expanding the Cloud Function count. */
function isInboundSmsPayload(req: Request): boolean {
  const b = req.body as Record<string, unknown> | undefined;
  if (!b) return false;
  if (b.EventType) return false;
  return typeof b.MessageSid === "string" && typeof b.From === "string";
}

/** Run the inbound-SMS relay and return the TwiML body to send back.
 *  Splitting the logic out of the response-emitting code keeps the
 *  function easy to unit-test (no `Response` type plumbing required). */
async function handleInboundSms(req: Request): Promise<string> {
  const body = (req.body?.Body ?? "") as string;
  const from = req.body.From as string;
  const result = await relayInboundSms(getFirestore(), from, body);
  if (result.matched) {
    // Empty TwiML — handled, but no auto-reply (the bishop sees the
    // message in chat; the speaker doesn't need a confirmation echo).
    return "<Response/>";
  }
  if (result.reason === "no-active-invitation") {
    // Genuinely unknown sender — politely tell them this isn't the way.
    return NO_MATCH_TWIML;
  }
  // empty-body or no-conversation: silent empty TwiML.
  // (We don't want to chastise a speaker for accidentally sending an
  // empty message; we don't want to leak invitation state by
  // responding differently when the conversation lookup fails.)
  return "<Response/>";
}

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
  const merged = await loadMergedInvitationByConversation(getFirestore(), conversationSid);
  if (!merged) return null;
  // ResolvedInvitation uses `token` for the doc id — keep that name
  // for back-compat with the existing notify helpers.
  return { ...merged, token: merged.invitationId };
}

function isExpired(inv: ResolvedInvitation): boolean {
  if (!inv.expiresAt) return false;
  return inv.expiresAt.toMillis() <= Date.now();
}
