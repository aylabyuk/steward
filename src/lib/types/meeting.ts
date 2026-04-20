import { z } from "zod";
import { assignmentSchema } from "./person";

export const MEETING_TYPES = ["regular", "fast", "stake", "general"] as const;
export const meetingTypeSchema = z.enum(MEETING_TYPES);
export type MeetingType = z.infer<typeof meetingTypeSchema>;

export const SPEAKER_STATUSES = ["planned", "invited", "confirmed", "declined"] as const;
export const speakerStatusSchema = z.enum(SPEAKER_STATUSES);
export type SpeakerStatus = z.infer<typeof speakerStatusSchema>;

export const SPEAKER_ROLES = ["Member", "Youth", "High Council", "Visiting"] as const;
export const speakerRoleSchema = z.enum(SPEAKER_ROLES);
export type SpeakerRole = z.infer<typeof speakerRoleSchema>;

export const MEETING_STATUSES = ["draft", "pending_approval", "approved", "published"] as const;
export const meetingStatusSchema = z.enum(MEETING_STATUSES);
export type MeetingStatus = z.infer<typeof meetingStatusSchema>;

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

export const approvalSchema = z.object({
  uid: z.string().min(1),
  email: z.email(),
  displayName: z.string().min(1),
  approvedAt: z.any(),
  approvedVersionHash: z.string().min(1),
  invalidated: z.boolean().default(false),
  invalidatedAt: z.any().optional(),
});
export type Approval = z.infer<typeof approvalSchema>;

// Specific-number is a lightweight variant of Assignment with performer + piece.
export const specialNumberSchema = z
  .object({
    performer: z.string().min(1),
    piece: z.string().optional(),
    status: assignmentSchema.shape.status,
  })
  .nullable();
export type SpecialNumber = z.infer<typeof specialNumberSchema>;

export const sacramentMeetingSchema = z.object({
  meetingType: meetingTypeSchema,
  status: meetingStatusSchema,
  cancellation: cancellationSchema.optional(),
  approvals: z.array(approvalSchema).default([]),
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
  specialNumber: specialNumberSchema.optional(),
  wardBusiness: z.string().default(""),
  stakeBusiness: z.string().default(""),
  announcements: z.string().default(""),
  presiding: assignmentSchema.optional(),
  conducting: assignmentSchema.optional(),
  lastNudgedAt: z.any().optional(),
  updatedAt: z.any().optional(),
  createdAt: z.any().optional(),
});
export type SacramentMeeting = z.infer<typeof sacramentMeetingSchema>;

export const speakerSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional().or(z.literal("")),
  topic: z.string().optional(),
  status: speakerStatusSchema,
  role: speakerRoleSchema.default("Member"),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});
export type Speaker = z.infer<typeof speakerSchema>;
