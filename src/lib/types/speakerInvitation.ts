import { z } from "zod";

/**
 * A frozen snapshot of a speaker invitation letter, stored under
 * `wards/{wardId}/speakerInvitations/{invitationId}`. Anyone with the
 * URL can read the doc (rule: `allow read: if true`); the doc ID is
 * unguessable, and a separate capability token in the URL authorizes
 * speaker sign-in (validated by the issueSpeakerSession callable
 * against the `tokenHash` on this doc).
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

/** Captured the first time the speaker taps Yes or No on the web side.
 *  SMS-only speakers who just text their answer back won't populate this
 *  — the bishop reads the thread and decides manually. */
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

  /** Snapshotted at send time so Firestore rules + Cloud Functions can
   *  gate writes without reading the live speaker doc. A signed-in
   *  Google account can only write the response subtree when its
   *  verified email matches (case-insensitive). Absent = speaker has no
   *  email on file, web-side response is disabled for this invitation. */
  speakerEmail: z.string().optional(),
  speakerPhone: z.string().optional(),

  /** Monday 00:00 local to the sender, written once at send time.
   *  Rules reject speaker-side writes past this; reads stay open so the
   *  bishopric can still review archived threads. */
  expiresAt: z.any().optional(),

  /** SHA-256 (hex) of the capability token that authorizes speaker
   *  sign-in. Plaintext token never lands in Firestore — only in the
   *  invitation URL delivered to the speaker's phone/email. On
   *  consumption the hash stays (so presenting the dead link can
   *  trigger rotation); rotation overwrites this with a fresh hash. */
  tokenHash: z.string().optional(),
  /** "active" after issue or rotation; "consumed" after a successful
   *  issueSpeakerSession exchange. A consumed token can't mint a
   *  session, but presenting it still triggers rotation (subject to
   *  the daily cap). */
  tokenStatus: z.enum(["active", "consumed"]).optional(),
  /** Hard wall for session exchange. Mirrors `expiresAt` on
   *  freshly-issued invitations; rotation doesn't extend it (once the
   *  meeting is past, the invitation is dead). */
  tokenExpiresAt: z.any().optional(),
  /** Visitor-triggered rotations per `yyyy-mm-dd`. Capped at 3/day
   *  per invitation to bound Twilio cost exposure if a link leaks. */
  tokenRotationsByDay: z.record(z.string(), z.number()).optional(),

  /** Twilio Conversation SID. Primary key the chat clients bootstrap
   *  against. Missing on pre-#16 invitations — those render read-only
   *  letters with no chat pane. */
  conversationSid: z.string().optional(),

  /** Delivery outcome(s) captured at send time. Populated by the
   *  sendSpeakerInvitation callable; displayed on the Prepare page as
   *  a small per-channel status strip. */
  deliveryRecord: z.array(speakerInvitationDeliverySchema).default([]),

  /** Active bishopric/clerk snapshot at send time. Used by the
   *  speaker's public invite page to label message bubbles by real
   *  name without needing to read the ward members collection. */
  bishopricParticipants: z.array(speakerInvitationStaffSchema).default([]),

  /** Populated by the speaker's Yes/No tap; acknowledged by the bishop
   *  via the Apply-response action. */
  response: speakerInvitationResponseSchema.optional(),

  /** Heartbeat written by the speaker's invite page (every 60s while
   *  the tab is visible + authenticated). The bishop-reply webhook
   *  reads this to decide whether to send an SMS-with-resume-link: if
   *  the heartbeat is fresh the speaker is presumed to be looking at
   *  the chat live and we stay quiet. */
  speakerLastSeenAt: z.any().optional(),

  /** Mirror of the underlying speaker doc's status, kept on the
   *  invitation so the speaker-side page can render status-aware
   *  copy without subscribing to the meeting-scoped speaker doc
   *  (which the speaker's capability-token session can't read).
   *  Written by the bishop's client when it applies a response or
   *  changes status via the chat-banner pills. Absent on pre-rollout
   *  invitations — the speaker page treats that as unchanged. */
  currentSpeakerStatus: z.enum(["planned", "invited", "confirmed", "declined"]).optional(),

  /** Picks the outbound SMS proxy number for this thread. Set to
   *  "testing" only when an allowlisted dev-mode caller sent the
   *  invitation; otherwise omitted (treated as "production"). The
   *  webhook + rotation paths read this back so every SMS in the
   *  thread routes through the same number. */
  fromNumberMode: z.enum(["production", "testing"]).optional(),
});
export type SpeakerInvitation = z.infer<typeof speakerInvitationSchema>;
