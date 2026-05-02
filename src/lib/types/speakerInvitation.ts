import { z } from "zod";

/**
 * A frozen snapshot of a speaker invitation letter, stored under
 * `wards/{wardId}/speakerInvitations/{invitationId}`. Anyone with the
 * URL can read the doc (rule: `allow read: if true`); the doc ID is
 * unguessable, and a separate capability token in the URL authorizes
 * speaker sign-in (validated by the issueSpeakerSession callable
 * against `tokenHash` on the private subdoc — see
 * `speakerInvitationAuth.ts` and the C1 doc-split fix).
 *
 * Sensitive fields — token state, speaker contact PII, the bishopric
 * roster snapshot, the full response object, presence heartbeat,
 * delivery audit, and the testing-number marker — moved into a
 * private subdoc at `…/private/auth`. The parent doc keeps only the
 * letter snapshot (so the speaker landing page can render without
 * auth) plus a tiny `responseSummary` denorm so the post-response
 * UI can switch out of "tap Yes/No" mode without authenticating.
 *
 * Snapshotting means the speaker keeps the exact letter they were
 * sent, even if the ward edits the template later.
 */
/** One entry per channel the bishop asked us to deliver on at send time.
 *  Lets the UI render a per-channel status ("email ✓ · SMS failed") and
 *  gives ops a readable audit of exactly what went out. */
export const speakerInvitationDeliverySchema = z.object({
  channel: z.enum(["email", "sms"]),
  status: z.enum(["sent", "failed", "fallback-sms"]),
  /** SendGrid message id or Twilio message/conversation SID. */
  providerId: z.string().optional(),
  error: z.string().optional(),
  at: z.any(),
});
export type SpeakerInvitationDelivery = z.infer<typeof speakerInvitationDeliverySchema>;

/** Snapshot of the active bishopric + clerk members at send time.
 *  Lets the speaker's public invite page show real names on bishop
 *  message bubbles — the speaker has no access to the ward members
 *  collection via Firestore rules, so we bake the minimum needed
 *  (uid + displayName + role) into the invitation itself. Grows
 *  stale as the ward changes; fine for one-invitation scope. */
export const speakerInvitationStaffSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  role: z.enum(["bishopric", "clerk"]),
  /** Email address — lets the bishop-side identity banner + the
   *  speaker-side bubble eyebrows show each staff member's email.
   *  Optional for backward compat with pre-refinement docs. */
  email: z.string().optional(),
});
export type SpeakerInvitationStaff = z.infer<typeof speakerInvitationStaffSchema>;

/** Public mirror of the speaker's response — only the two fields the
 *  pre-auth landing page needs to switch out of "tap Yes/No" mode.
 *  Written atomically with the full private response (which carries
 *  reason text, actor identity, and acknowledgement audit). */
export const speakerInvitationResponseSummarySchema = z.object({
  answer: z.enum(["yes", "no"]),
  respondedAt: z.any(),
});
export type SpeakerInvitationResponseSummary = z.infer<
  typeof speakerInvitationResponseSummarySchema
>;

/** Captured the first time the speaker taps Yes or No on the web side.
 *  SMS-only speakers who just text their answer back won't populate this
 *  — the bishop reads the thread and decides manually.
 *
 *  @deprecated The full shape moved to the private subdoc as
 *  `speakerInvitationResponsePrivateSchema`; the parent doc keeps only
 *  `speakerInvitationResponseSummarySchema`. Retained here so existing
 *  consumers of the merged client view still typecheck during the
 *  migration window. */
export const speakerInvitationResponseSchema = z.object({
  answer: z.enum(["yes", "no"]),
  reason: z.string().optional(),
  respondedAt: z.any(),
  /** Firebase Auth uid of the signed-in speaker at submit. The
   *  speaker uid is deterministic per invitation
   *  (`speaker:{wardId}:{invitationId}`) — minted by
   *  issueSpeakerSession from a custom token. */
  actorUid: z.string(),
  /** Verified email, if the speaker signed in via email/Google auth.
   *  Capability-token speakers leave this blank. */
  actorEmail: z.string().optional(),
  /** Bishop pressed "Apply as confirmed/declined" and the mirror write
   *  to `speaker.status` landed. Until then the schedule badge still
   *  says "speaker replied — needs review". */
  acknowledgedAt: z.any().optional(),
  acknowledgedBy: z.string().optional(),
});
export type SpeakerInvitationResponse = z.infer<typeof speakerInvitationResponseSchema>;

export const speakerInvitationSchema = z.object({
  /** Discriminator for which kind of participant this invitation is
   *  for. Default "speaker" preserves back-compat for invitations
   *  written before the prayer flow shipped; "prayer" routes through
   *  the same Cloud Function + Twilio Conversation infrastructure
   *  but with prayer-specific copy + the prayer letter template.
   *  When `kind === "prayer"`, `prayerRole` is required and
   *  `speakerRef.speakerId` holds the prayer role ("opening" |
   *  "benediction") rather than a speaker doc ID. */
  kind: z.enum(["speaker", "prayer"]).default("speaker"),
  /** Set only when `kind === "prayer"`. Mirrors the participant doc's
   *  role at `wards/{wardId}/meetings/{date}/prayers/{role}`. */
  prayerRole: z.enum(["opening", "benediction"]).optional(),
  /** Denormalized participant reference back to the originating doc.
   *  For speakers: `speakerId` is the speaker doc ID. For prayers:
   *  `speakerId` holds the role string ("opening" | "benediction")
   *  matching the prayer participant doc path. The field name is
   *  retained for back-compat — see follow-up rename issue. */
  speakerRef: z.object({
    meetingDate: z.string(), // ISO YYYY-MM-DD
    speakerId: z.string().min(1),
  }),
  /** Pre-formatted "Sunday, April 26, 2026" for the assigned-Sunday callout. */
  assignedDate: z.string().min(1),
  /** Pre-formatted "April 21, 2026" for the letter date line. */
  sentOn: z.string().min(1),
  wardName: z.string(),
  speakerName: z.string().min(1),
  speakerTopic: z.string().optional(),
  inviterName: z.string().min(1),
  /** Markdown body post-interpolation — all `{{vars}}` already replaced. */
  bodyMarkdown: z.string(),
  /** Scripture footer post-interpolation. */
  footerMarkdown: z.string(),
  /** Lexical EditorState as a JSON string, post-interpolation — the
   *  WYSIWYG-authored letter the bishop saw on screen. Optional during
   *  the migration window: invitations created before the WYSIWYG
   *  renderer rolled out won't have it, and the speaker landing page
   *  falls back to rendering `bodyMarkdown` + hardcoded chrome. */
  editorStateJson: z.string().optional(),
  createdAt: z.any().optional(),

  /** Monday 00:00 local to the sender, written once at send time.
   *  Rules reject speaker-side writes past this; reads stay open so the
   *  bishopric can still review archived threads. */
  expiresAt: z.any().optional(),

  /** Twilio Conversation SID. Primary key the chat clients bootstrap
   *  against. Missing on pre-#16 invitations — those render read-only
   *  letters with no chat pane. Public so the speaker invite page can
   *  bootstrap the Twilio client without reading the private subdoc. */
  conversationSid: z.string().optional(),

  /** Public mirror of the speaker's response — only `answer` +
   *  `respondedAt` so the landing page can switch out of "tap Yes/No"
   *  mode without authenticating. The full response (reason, actor
   *  identity, acknowledgement audit) lives on the private subdoc.
   *  Written atomically with the private response. */
  responseSummary: speakerInvitationResponseSummarySchema.optional(),

  /** Mirror of the underlying speaker doc's status, kept on the
   *  invitation so the speaker-side page can render status-aware
   *  copy without subscribing to the meeting-scoped speaker doc
   *  (which the speaker's capability-token session can't read).
   *  Written by the bishop's client when it applies a response or
   *  changes status via the chat-banner pills. Absent on pre-rollout
   *  invitations — the speaker page treats that as unchanged. */
  currentSpeakerStatus: z.enum(["planned", "invited", "confirmed", "declined"]).optional(),

  // ---------------------------------------------------------------
  // The fields below were public until the C1 doc-split fix. They're
  // marked `.optional()` here so Zod parses still succeed against
  // pre-migration parent docs (which carried these directly), but
  // every code path now reads/writes them through the private subdoc.
  // The migration script `scripts/migrate-invitation-doc-split.ts`
  // moves them off the parent. Once the migration has run for every
  // ward and we're confident there are no pre-migration parents in
  // the wild, drop these fields entirely.
  // ---------------------------------------------------------------
  /** @deprecated moved to private subdoc (`speakerInvitationAuth.ts`). */
  speakerEmail: z.string().optional(),
  /** @deprecated moved to private subdoc. */
  speakerPhone: z.string().optional(),
  /** @deprecated moved to private subdoc. */
  tokenHash: z.string().optional(),
  /** @deprecated moved to private subdoc. */
  tokenStatus: z.enum(["active", "consumed"]).optional(),
  /** @deprecated moved to private subdoc. */
  tokenExpiresAt: z.any().optional(),
  /** @deprecated moved to private subdoc. */
  tokenRotationsByDay: z.record(z.string(), z.number()).optional(),
  /** @deprecated moved to private subdoc. */
  deliveryRecord: z.array(speakerInvitationDeliverySchema).default([]),
  /** @deprecated moved to private subdoc. */
  bishopricParticipants: z.array(speakerInvitationStaffSchema).default([]),
  /** @deprecated moved to private subdoc; only `responseSummary` (above) lives on the public doc. */
  response: speakerInvitationResponseSchema.optional(),
  /** @deprecated moved to private subdoc. */
  speakerLastSeenAt: z.any().optional(),
  /** @deprecated moved to private subdoc. */
  fromNumberMode: z.enum(["production", "testing"]).optional(),
});
export type SpeakerInvitation = z.infer<typeof speakerInvitationSchema>;
