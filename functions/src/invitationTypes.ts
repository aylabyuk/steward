/** Shared type shape for the speakerInvitation document as seen by
 *  Cloud Functions (Admin SDK). Keeps the webhook + callable free of
 *  importing from the web Zod schema.
 *
 *  Note (C1 doc-split): the underlying storage is now two docs —
 *  the public parent at `wards/{wardId}/speakerInvitations/{id}` and
 *  the private auth subdoc at `…/private/auth`. Loader helpers in
 *  `invitationDocs.ts` read both and return this merged shape so
 *  consumers don't need to know about the split. The split only
 *  matters at write time (helpers below pick the right doc). */
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
  /** Public mirror of `response.answer` + `response.respondedAt` so
   *  the speaker's pre-auth landing page can switch out of "tap
   *  Yes/No" mode without reading the private subdoc. Written
   *  atomically with the full response on the subdoc. */
  responseSummary?: {
    answer: "yes" | "no";
    respondedAt: FirebaseFirestore.Timestamp;
  };
  bishopricParticipants?: {
    uid: string;
    displayName: string;
    role: "bishopric" | "clerk";
    email?: string;
  }[];
  currentSpeakerStatus?: "planned" | "invited" | "confirmed" | "declined";
}

/** Fields that live on the public parent doc only. */
export type SpeakerInvitationPublicShape = Pick<
  SpeakerInvitationShape,
  | "kind"
  | "prayerRole"
  | "speakerRef"
  | "assignedDate"
  | "sentOn"
  | "wardName"
  | "speakerName"
  | "speakerTopic"
  | "inviterName"
  | "bodyMarkdown"
  | "footerMarkdown"
  | "conversationSid"
  | "expiresAt"
  | "responseSummary"
  | "currentSpeakerStatus"
>;

/** Fields that live on the private subdoc at
 *  `…/speakerInvitations/{id}/private/auth`. Subset of the merged
 *  shape — no overlap with `SpeakerInvitationPublicShape` keys. */
export type SpeakerInvitationAuthShape = Pick<
  SpeakerInvitationShape,
  | "tokenHash"
  | "tokenStatus"
  | "tokenExpiresAt"
  | "tokenRotationsByDay"
  | "speakerEmail"
  | "speakerPhone"
  | "bishopricParticipants"
  | "response"
  | "speakerLastSeenAt"
  | "fromNumberMode"
  | "deliveryRecord"
>;

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
