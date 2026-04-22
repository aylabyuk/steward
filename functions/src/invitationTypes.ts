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
  response?: {
    answer: "yes" | "no";
    reason?: string;
    respondedAt?: FirebaseFirestore.Timestamp;
    actorUid?: string;
    actorEmail?: string;
    acknowledgedAt?: FirebaseFirestore.Timestamp;
    acknowledgedBy?: string;
  };
}
