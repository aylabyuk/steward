import { z } from "zod";
import { speakerInvitationDeliverySchema, speakerInvitationStaffSchema } from "./speakerInvitation";

// Re-export the public response-summary schema for callers that load
// both halves of the split — keeps the import surface from the
// `auth` module self-contained.
export {
  speakerInvitationResponseSummarySchema,
  type SpeakerInvitationResponseSummary,
} from "./speakerInvitation";

/**
 * Private auth subdoc at
 * `wards/{wardId}/speakerInvitations/{invitationId}/private/auth`.
 *
 * Holds everything that must NOT be readable by an anonymous visitor
 * who happens to know the invitation URL: capability-token state, the
 * speaker's contact PII, the bishopric roster snapshot, presence
 * heartbeat, delivery audit, and the sensitive parts of the speaker's
 * response (reason text, acting-actor identity, acknowledgement
 * audit). The parent doc stays world-readable so the speaker landing
 * page can render the letter without auth.
 *
 * Lives at a fixed doc id `auth` so rules can scope access by the
 * stable subcollection path. Rules:
 *  - Speaker (custom-token session with `invitationId` + `wardId`
 *    claims): read; update only `response` (answer/reason/respondedAt
 *    /actor*) + `speakerLastSeenAt`, gated by `tokenStatus === 'active'`
 *    and `tokenExpiresAt > now()`.
 *  - Active bishopric/clerk: read; update only `response.acknowledgedAt`
 *    + `response.acknowledgedBy` (the bishop "Apply" path).
 *  - Cloud Functions create/delete via Admin SDK (rules bypassed).
 *
 * The `response.answer` + `response.respondedAt` denorm onto the
 * parent doc as `responseSummary` is written atomically with the
 * private update so the public landing page can still render the
 * "already responded" gate without authenticating.
 */

/** Sensitive parts of the speaker's response. The narrow public mirror
 *  (`responseSummary` on the parent doc) carries only `answer` +
 *  `respondedAt`; everything else lives here. */
export const speakerInvitationResponsePrivateSchema = z.object({
  answer: z.enum(["yes", "no"]),
  reason: z.string().optional(),
  respondedAt: z.any(),
  /** Firebase Auth uid of the signed-in speaker at submit. */
  actorUid: z.string(),
  /** Verified email, when the speaker signed in via email/Google.
   *  Capability-token-only speakers leave this blank. */
  actorEmail: z.string().optional(),
  /** Bishop pressed "Apply" and the mirror write to `speaker.status`
   *  landed. Until then the schedule's per-speaker chat icon still
   *  shows the needs-apply dot. */
  acknowledgedAt: z.any().optional(),
  acknowledgedBy: z.string().optional(),
});
export type SpeakerInvitationResponsePrivate = z.infer<
  typeof speakerInvitationResponsePrivateSchema
>;

export const speakerInvitationAuthSchema = z.object({
  /** SHA-256 (hex) of the capability token that authorizes speaker
   *  sign-in. Plaintext token never lands in Firestore — only in the
   *  invitation URL delivered to the speaker's phone/email. */
  tokenHash: z.string().optional(),
  /** "active" after issue or rotation; "consumed" after a successful
   *  issueSpeakerSession exchange. */
  tokenStatus: z.enum(["active", "consumed"]).optional(),
  /** Hard wall for session exchange. Mirrors `expiresAt` on the
   *  parent doc at issue time. */
  tokenExpiresAt: z.any().optional(),
  /** Visitor-triggered rotations per `yyyy-mm-dd`. Capped at 3/day
   *  to bound Twilio cost exposure if a link leaks. */
  tokenRotationsByDay: z.record(z.string(), z.number()).optional(),

  /** Speaker contact PII snapshotted at send time. Used by the
   *  bishop-reply notification path + delivery audit. */
  speakerEmail: z.string().optional(),
  speakerPhone: z.string().optional(),

  /** Active bishopric/clerk snapshot at send time. Used by the
   *  speaker's invite page (post-auth) to label chat bubbles by
   *  real name. Carries email so the bishop banner + bubble eyebrow
   *  can render addresses without the speaker reading the ward
   *  members collection. */
  bishopricParticipants: z.array(speakerInvitationStaffSchema).default([]),

  /** Full response object (sensitive bits — answer/respondedAt mirror
   *  to `responseSummary` on the public parent for pre-auth render). */
  response: speakerInvitationResponsePrivateSchema.optional(),

  /** Heartbeat written by the speaker's invite page (every 60s while
   *  the tab is visible + authenticated). The bishop-reply webhook
   *  reads this to decide whether to send an SMS-with-resume-link. */
  speakerLastSeenAt: z.any().optional(),

  /** Picks the outbound SMS proxy number for this thread. Set to
   *  "testing" only when an allowlisted dev-mode caller sent the
   *  invitation; otherwise omitted (treated as "production"). */
  fromNumberMode: z.enum(["production", "testing"]).optional(),

  /** Delivery outcome(s) captured at send time + on rotation. */
  deliveryRecord: z.array(speakerInvitationDeliverySchema).default([]),
});
export type SpeakerInvitationAuth = z.infer<typeof speakerInvitationAuthSchema>;

/** Stable subcollection path. Single doc named `auth` so rules can
 *  match the exact ID rather than wildcarding the whole subcollection. */
export const SPEAKER_INVITATION_AUTH_DOC = "auth" as const;
export const speakerInvitationAuthPath = (wardId: string, invitationId: string): string =>
  `wards/${wardId}/speakerInvitations/${invitationId}/private/${SPEAKER_INVITATION_AUTH_DOC}`;
