/** Shared type shape for the speakerInvitation document as seen by
 *  Cloud Functions (Admin SDK). Keeps the webhook + callable free of
 *  importing from the web Zod schema. */
export interface SpeakerInvitationShape {
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
}
