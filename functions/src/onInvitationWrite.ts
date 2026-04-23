import { getFirestore } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { classifyInvitationChange } from "./invitationChange.js";
import { notifyBishopricOfResponse } from "./invitationResponseNotify.js";
import { readMessageTemplate } from "./messageTemplates.js";
import {
  fetchActiveBishopricEmails,
  sendBishopricReceipt,
  sendSpeakerReceipt,
} from "./onInvitationWrite.helpers.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

/** Fires receipt emails on authoritative response transitions:
 *   - `response.answer` appears or flips → speaker receipt (to speaker,
 *      CC bishopric) + FCM push to the bishopric.
 *   - `response.acknowledgedAt` appears → bishopric receipt (to bishopric).
 *
 *  The speaker receipt intentionally does NOT carry an invite link: any
 *  URL we'd embed requires rotating the capability token, which in turn
 *  invalidates the speaker's original SMS link. The canonical re-entry
 *  point is the SMS — if the speaker reopens a consumed SMS link,
 *  `decideTokenAction` rotates on demand and texts them a fresh URL.
 *  See #73 for the regression this behavior restores.
 *
 *  Other writes (token rotation, delivery-record updates, heartbeats)
 *  are classified as no-ops and return early. */
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
        const headerTemplate = await readMessageTemplate(db, wardId, key);
        await Promise.all([
          sendSpeakerReceipt(after, bishopric, headerTemplate),
          notifyBishopricOfResponse(db, wardId, invitationId, before, after, origin),
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
