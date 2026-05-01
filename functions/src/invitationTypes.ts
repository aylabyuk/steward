/** Shared type shape for the speakerInvitation document as seen by
 *  Cloud Functions (Admin SDK). Keeps the webhook + callable free of
 *  importing from the web Zod schema. */
export interface SpeakerInvitationShape {
  /** Discriminator for which kind of participant this invitation is
   *  for. Default "speaker" (treat absent as speaker for back-compat
   *  with pre-prayer-flow rows). */
  kind?: "speaker" | "prayer";
  /** Set only when `kind === "prayer"`. Mirrors the prayer
   *  participant doc's role at
   *  `wards/{wardId}/meetings/{date}/prayers/{role}`. */
  prayerRole?: "opening" | "benediction";
  speakerRef: { meetingDate: string; speakerId: string };
  assignedDate: string;
  sentOn: string;
  wardName: string;
  speakerName: string;
  speakerTopic?: string;
  inviterName: string;
  bodyMarkdown: string;
  footerMarkdown: string;
  speakerEmail?: string;
  speakerPhone?: string;
  conversationSid?: string;
  deliveryRecord?: {
    channel: "email" | "sms";
    status: "sent" | "failed";
    providerId?: string;
    error?: string;
    at: Date | FirebaseFirestore.Timestamp;
  }[];
  expiresAt?: FirebaseFirestore.Timestamp;
  /** Capability-token columns (see src/lib/types/speakerInvitation.ts
   *  for the full doc). The hash is kept after consumption so a
   *  holder of a dead link can still trigger a fresh-SMS rotation. */
  tokenHash?: string;
  tokenStatus?: "active" | "consumed";
  tokenExpiresAt?: FirebaseFirestore.Timestamp;
  tokenRotationsByDay?: Record<string, number>;
  response?: {
    answer: "yes" | "no";
    reason?: string;
    respondedAt?: FirebaseFirestore.Timestamp;
    actorUid?: string;
    actorEmail?: string;
    acknowledgedAt?: FirebaseFirestore.Timestamp;
    acknowledgedBy?: string;
  };
  /** Heartbeat written by the speaker's invite page while the tab is
   *  visible. Used by the bishop-reply webhook to skip SMS when the
   *  speaker is presumed online. */
  speakerLastSeenAt?: FirebaseFirestore.Timestamp;
  /** Picks the outbound SMS proxy number for this thread. Set to
   *  "testing" only when an allowlisted dev-mode caller sent the
   *  invitation; otherwise omitted (treated as "production"). All
   *  subsequent SMS for this invitation route through the same
   *  number — see `twilio/fromNumber.ts`. */
  fromNumberMode?: "production" | "testing";
}

/** User-facing label for a prayer-kind invitation, used to fill the
 *  `{{prayerType}}` token in SMS / email / receipt templates. Returns
 *  undefined for speaker invitations so callers can spread it
 *  conditionally into vars bags. */
export function invitationPrayerType(
  invitation: Pick<SpeakerInvitationShape, "kind" | "prayerRole">,
): string | undefined {
  if (invitation.kind !== "prayer" || !invitation.prayerRole) return undefined;
  return invitation.prayerRole === "opening" ? "opening prayer" : "closing prayer";
}
