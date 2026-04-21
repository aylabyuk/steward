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
});
export type SpeakerInvitation = z.infer<typeof speakerInvitationSchema>;
