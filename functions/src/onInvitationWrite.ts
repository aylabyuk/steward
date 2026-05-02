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
  sendSpeakerReceiptSms,
} from "./onInvitationWrite.helpers.js";
import { STEWARD_ORIGIN } from "./secrets.js";
import type { SpeakerInvitationShape } from "./invitationTypes.js";

/** Fires on writes to the private auth subdoc at
 *  `wards/{wardId}/speakerInvitations/{invitationId}/private/auth`
 *  (post C1 doc-split). Handles authoritative response transitions:
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
  "wards/{wardId}/speakerInvitations/{invitationId}/private/{authDoc}",
  async (event) => {
    if (event.params.authDoc !== "auth") return;
    // Trigger fires on the auth subdoc; merge with the public parent
    // so downstream helpers see the same shape they did pre-split.
    const beforeAuth = event.data?.before.data() as SpeakerInvitationShape | undefined;
    const afterAuth = event.data?.after.data() as SpeakerInvitationShape | undefined;

    const { wardId, invitationId } = event.params;
    const db = getFirestore();
    const parentSnap = await db.doc(`wards/${wardId}/speakerInvitations/${invitationId}`).get();
    const parent = (parentSnap.exists ? parentSnap.data() : undefined) as
      | SpeakerInvitationShape
      | undefined;
    const before: SpeakerInvitationShape | undefined =
      beforeAuth || parent ? ({ ...parent, ...beforeAuth } as SpeakerInvitationShape) : undefined;
    const after: SpeakerInvitationShape | undefined =
      afterAuth || parent ? ({ ...parent, ...afterAuth } as SpeakerInvitationShape) : undefined;
    const change = classifyInvitationChange(before, after);
    if (!change.fireSpeaker && !change.fireBishopric) return;
    if (!after) return;
    const origin = process.env.STEWARD_ORIGIN ?? STEWARD_ORIGIN.value();
    try {
      const bishopric = await fetchActiveBishopricEmails(db, wardId);
      const isPrayer = after.kind === "prayer";
      if (change.fireSpeaker) {
        const answer = after.response?.answer;
        const speakerKey = isPrayer
          ? answer === "yes"
            ? "prayerResponseAccepted"
            : "prayerResponseDeclined"
          : answer === "yes"
            ? "speakerResponseAccepted"
            : "speakerResponseDeclined";
        const headerTemplate = await readMessageTemplate(db, wardId, speakerKey);
        // allSettled — one leg failing must NOT cancel the other.
        // Promise.all rejects on first failure; the outer try/catch
        // then catches and the function exits, which tears down the
        // container and kills any in-flight operation. Waiting on
        // allSettled keeps both sides running to completion.
        const results = await Promise.allSettled([
          sendSpeakerReceipt(after, bishopric, headerTemplate),
          sendSpeakerReceiptSms(db, wardId, after),
          notifyBishopricOfResponse(db, wardId, invitationId, before, after),
        ]);
        for (const r of results) {
          if (r.status === "rejected") {
            logger.error("speaker-response side effect failed", {
              wardId,
              invitationId,
              err: (r.reason as Error)?.message ?? String(r.reason),
            });
          }
        }
      }
      if (change.fireBishopric) {
        const bishopricKey = isPrayer
          ? "prayerBishopricResponseReceipt"
          : "bishopricResponseReceipt";
        const headerTemplate = await readMessageTemplate(db, wardId, bishopricKey);
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
