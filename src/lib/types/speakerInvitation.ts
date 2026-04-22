import { z } from "zod";

/**
 * A frozen snapshot of a speaker invitation letter, stored under
 * `wards/{wardId}/speakerInvitations/{token}`. The doc's auto-
 * generated ID doubles as the shareable link token: anyone with the
 * URL can read the doc (rule: `allow read: if true`), which is safe
 * because the token is unguessable (~120 bits of entropy from
 * Firestore's auto-ID).
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
  /** Firebase Auth uid of the signed-in speaker at submit. Works
   *  regardless of auth method (phone OTP or email). */
  actorUid: z.string(),
  /** Verified email, if the speaker signed in via email/Google auth.
   *  Phone-authed speakers leave this blank in favor of actorPhone. */
  actorEmail: z.string().optional(),
  /** Verified E.164 phone number for phone-authed speakers. The
   *  default auth path on the invite page now — since we already
   *  reached the speaker by SMS, verifying the same phone proves
   *  identity without asking them to switch Google accounts. */
  actorPhone: z.string().optional(),
  /** Bishop pressed "Apply as confirmed/declined" and the mirror write
   *  to `speaker.status` landed. Until then the schedule badge still
   *  says "speaker replied — needs review". */
  acknowledgedAt: z.any().optional(),
  acknowledgedBy: z.string().optional(),
});
export type SpeakerInvitationResponse = z.infer<typeof speakerInvitationResponseSchema>;

export const speakerInvitationSchema = z.object({
  /** Denormalized speaker reference back to the originating doc. */
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
});
export type SpeakerInvitation = z.infer<typeof speakerInvitationSchema>;
