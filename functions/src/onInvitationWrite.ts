import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { classifyInvitationChange } from "./invitationChange.js";
import { notifyBishopricOfResponse } from "./invitationResponseNotify.js";
import { readMessageTemplate } from "./messageTemplates.js";
import {
  fetchActiveBishopricEmails,
  rotateInviteUrl,
  sendBishopricReceipt,
  sendSpeakerReceipt,
} from "./onInvitationWrite.helpers.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

/** Fires receipt emails on authoritative response transitions:
 *   - `response.answer` appears or flips → speaker receipt (to speaker,
 *      CC bishopric) with a freshly-rotated invite link so they can
 *      reopen the chat even if the original SMS has been deleted.
 *   - `response.acknowledgedAt` appears → bishopric receipt (to bishopric)
 *
 *  Other writes (token rotation, delivery-record updates, heartbeats)
 *  are classified as no-ops and return early. The receipts contain the
 *  original letter inline so the email itself is the archive — no
 *  external dependency on the app being reachable. */
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
    const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
    try {
      const bishopric = await fetchActiveBishopricEmails(db, wardId);
      if (change.fireSpeaker) {
        const answer = after.response?.answer;
        const key = answer === "yes" ? "speakerResponseAccepted" : "speakerResponseDeclined";
        const [headerTemplate, inviteUrl] = await Promise.all([
          readMessageTemplate(db, wardId, key),
          rotateInviteUrl(wardId, invitationId, origin),
        ]);
        await Promise.all([
          sendSpeakerReceipt(after, bishopric, headerTemplate, inviteUrl),
          notifyBishopricOfResponse(db, wardId, invitationId, before, after),
        ]);
      }
      if (change.fireBishopric) {
        const headerTemplate = await readMessageTemplate(db, wardId, "bishopricResponseReceipt");
        await sendBishopricReceipt(after, bishopric, {
          wardId,
          invitationId,
          origin,
          headerTemplate,
        });
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
