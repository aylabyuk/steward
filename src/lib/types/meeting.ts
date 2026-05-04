import { z } from "zod";
import { programTemplateSchema } from "./template";
import { assignmentSchema } from "./person";

export const MEETING_TYPES = ["regular", "fast", "stake", "general"] as const;
export const meetingTypeSchema = z.enum(MEETING_TYPES);
export type MeetingType = z.infer<typeof meetingTypeSchema>;

// Shared invitation lifecycle for both speakers and prayer-givers.
// `SPEAKER_STATUSES` / `speakerStatusSchema` / `SpeakerStatus` are
// retained as aliases so existing speaker call sites don't churn —
// new invitation kinds (prayers, future) should import the
// `INVITATION_*` names directly.
export const INVITATION_STATUSES = ["planned", "invited", "confirmed", "declined"] as const;
export const invitationStatusSchema = z.enum(INVITATION_STATUSES);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;

export const SPEAKER_STATUSES = INVITATION_STATUSES;
export const speakerStatusSchema = invitationStatusSchema;
export type SpeakerStatus = InvitationStatus;

export const SPEAKER_ROLES = ["Member", "Youth", "High Council", "Visiting"] as const;
export const speakerRoleSchema = z.enum(SPEAKER_ROLES);
export type SpeakerRole = z.infer<typeof speakerRoleSchema>;

export const hymnSchema = z.object({
  number: z.number().int().min(1),
  title: z.string().min(1),
});
export type Hymn = z.infer<typeof hymnSchema>;

export const cancellationSchema = z
  .object({
    cancelled: z.literal(true),
    reason: z.string().min(1),
    cancelledAt: z.any(),
    cancelledBy: z.string().min(1),
  })
  .nullable();
export type Cancellation = z.infer<typeof cancellationSchema>;

// Visiting authorities, ward members, or other guests to be recognized
// from the stand (stake leaders, mission president, etc.). `details`
// is free-form — typically their calling or a short descriptor.
// `name` allows empty strings so newly-added rows can persist as drafts
// until the user types something. The Leaders UI renders the placeholder
// when the row is blank; content hash + history treat it as a real field.
export const visitorSchema = z.object({
  name: z.string().default(""),
  details: z.string().optional(),
});
export type Visitor = z.infer<typeof visitorSchema>;

// Mid-meeting item: between sacrament and speakers, a rest hymn OR a
// musical number (performer only) OR none. `midAfter` chooses which speaker
// index to pin the placeholder row below in the Program speaker list.
export const MID_MODES = ["none", "rest", "musical"] as const;
export const midModeSchema = z.enum(MID_MODES);
export type MidMode = z.infer<typeof midModeSchema>;

export const midItemSchema = z.object({
  mode: midModeSchema.default("none"),
  rest: hymnSchema.nullable().optional(),
  musical: z
    .object({
      performer: z.string(),
    })
    .nullable()
    .optional(),
  midAfter: z.number().int().min(0).default(1),
});
export type MidItem = z.infer<typeof midItemSchema>;

export const sacramentMeetingSchema = z.object({
  meetingType: meetingTypeSchema,
  cancellation: cancellationSchema.optional(),
  contentVersionHash: z.string().optional(),
  openingHymn: hymnSchema.nullable().optional(),
  sacramentHymn: hymnSchema.nullable().optional(),
  closingHymn: hymnSchema.nullable().optional(),
  openingPrayer: assignmentSchema.optional(),
  benediction: assignmentSchema.optional(),
  pianist: assignmentSchema.optional(),
  chorister: assignmentSchema.optional(),
  sacramentBread: assignmentSchema.optional(),
  sacramentBlessers: z.array(assignmentSchema).max(2).optional(),
  mid: midItemSchema.optional(),
  wardBusiness: z.string().default(""),
  stakeBusiness: z.string().default(""),
  announcements: z.string().default(""),
  showAnnouncements: z.boolean().default(true),
  presiding: assignmentSchema.optional(),
  conducting: assignmentSchema.optional(),
  visitors: z.array(visitorSchema).default([]),
  /** URL of the cover image shown on the congregation copy's left
   *  panel (above the announcements). Nullish — when absent or null
   *  the cover renders ward branding + announcements only. The write
   *  helper clears with `null`, so the schema must accept it. */
  coverImageUrl: z.string().nullish(),
  /** Footer note printed at the bottom of the congregation copy's
   *  right (program) panel — typically a reverence prompt like
   *  "Quietly ponder the prelude music…". Undefined / null falls
   *  back to the ward default → built-in default; an explicit empty
   *  string hides the footer. */
  programFooterNote: z.string().nullish(),
  /** Per-Sunday overrides for the printed program. When present, the
   *  prepare-to-print + print routes use these saved Lexical states
   *  instead of the ward-level template — so the bishopric can tailor
   *  one Sunday's program without changing the template that future
   *  weeks inherit. The shape mirrors the ward template doc so the
   *  same editor + render path can read either. */
  programs: z
    .object({
      conducting: programTemplateSchema.optional(),
      congregation: programTemplateSchema.optional(),
    })
    .optional(),
  updatedAt: z.any().optional(),
  createdAt: z.any().optional(),
});
export type SacramentMeeting = z.infer<typeof sacramentMeetingSchema>;

// Per-speaker override of the ward invitation letter template. Stored
// as Markdown with `{{variable}}` tokens still intact — tokens are
// resolved at send time so `{{today}}` etc. stay current. Absent
// override means "use the ward default template".
export const speakerLetterOverrideSchema = z.object({
  /** Lexical EditorState JSON — new WYSIWYG storage for per-speaker
   *  overrides. Optional during the dual-write window so existing
   *  overrides written before the migration keep parsing. */
  editorStateJson: z.string().optional(),
  bodyMarkdown: z.string(),
  footerMarkdown: z.string(),
  updatedAt: z.any().optional(),
});
export type SpeakerLetterOverride = z.infer<typeof speakerLetterOverrideSchema>;

// Provenance for the last `status` change on a speaker row. "speaker-response"
// means it was mirrored from a speaker's Yes/No reply on the invite page (via
// `applyResponseToSpeaker`); "manual" means a bishopric member set it directly
// in the schedule or speaker form. Surfaced next to the status badge so the
// team audits itself — the invite flow isn't a security boundary, just a
// workflow, and the bishopric has ultimate authority on status either way.
export const STATUS_SOURCES = ["speaker-response", "manual"] as const;
export const statusSourceSchema = z.enum(STATUS_SOURCES);
export type StatusSource = z.infer<typeof statusSourceSchema>;

// Tolerate legacy speaker docs that stored a status outside the current
// enum (e.g. "draft", "sent") — fall back to "planned" rather than failing
// the whole list parse.
export const speakerSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional().or(z.literal("")),
  // Free-form: bishops type what they'd text anyway (e.g. "555-123-4567",
  // "+15551234567"). We sanitize to E.164-ish at send time for the `sms:`
  // URL. Empty string tolerated so newly-added rows can persist as drafts.
  phone: z.string().optional().or(z.literal("")),
  topic: z.string().optional(),
  status: speakerStatusSchema.catch("planned"),
  role: speakerRoleSchema.catch("Member"),
  order: z.number().int().min(0).optional(),
  letterOverride: speakerLetterOverrideSchema.optional(),
  statusSource: statusSourceSchema.optional(),
  statusSetBy: z.string().optional(),
  statusSetAt: z.any().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});
export type Speaker = z.infer<typeof speakerSchema>;

// Prayer-giver participant — promoted from the lightweight inline
// `Assignment` row on the meeting (`openingPrayer`, `benediction`)
// when the bishop wants to send a formal invitation. Stored at
// `wards/{wardId}/meetings/{date}/prayers/{role}` (one doc per slot).
// The status enum is shared with speakers (see `INVITATION_STATUSES`).
export const PRAYER_ROLES = ["opening", "benediction"] as const;
export const prayerRoleSchema = z.enum(PRAYER_ROLES);
export type PrayerRole = z.infer<typeof prayerRoleSchema>;

export const prayerParticipantSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  role: prayerRoleSchema,
  status: invitationStatusSchema.catch("planned"),
  letterOverride: speakerLetterOverrideSchema.optional(),
  invitationId: z.string().optional(),
  conversationSid: z.string().optional(),
  statusSource: statusSourceSchema.optional(),
  statusSetBy: z.string().optional(),
  statusSetAt: z.any().optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});
export type PrayerParticipant = z.infer<typeof prayerParticipantSchema>;
