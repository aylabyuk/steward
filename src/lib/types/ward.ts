import { z } from "zod";
import { meetingTypeSchema } from "./meeting";

export const nonMeetingSundaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: meetingTypeSchema,
  note: z.string().optional(),
});
export type NonMeetingSunday = z.infer<typeof nonMeetingSundaySchema>;

export const wardSettingsSchema = z.object({
  timezone: z.string().min(1).default("UTC"),
  speakerLeadTimeDays: z.number().int().min(0).max(60).default(14),
  scheduleHorizonWeeks: z.number().int().min(1).max(52).default(8),
  nonMeetingSundays: z.array(nonMeetingSundaySchema).default([]),
  emailCcDefaults: z.record(z.string(), z.boolean()).default({}),
  defaultPianistUid: z.string().optional(),
});
export type WardSettings = z.infer<typeof wardSettingsSchema>;

/** Ward-level defaults for the congregation print bulletin. Per-meeting
 *  overrides on the meeting doc (`coverImageUrl`, `programFooterNote`)
 *  win when set; otherwise the print + prepare paths fall back to
 *  these. Configurable from /settings/templates/programs.
 *
 *  Fields are `nullish` because the write helper clears values by
 *  storing `null` (rather than `deleteField()`) — Zod must accept
 *  `string | null | undefined` so the ward doc still parses after a
 *  clear. */
export const congregationDefaultsSchema = z.object({
  coverImageUrl: z.string().nullish(),
  programFooterNote: z.string().nullish(),
});
export type CongregationDefaults = z.infer<typeof congregationDefaultsSchema>;

export const wardSchema = z.object({
  name: z.string().min(1),
  settings: wardSettingsSchema,
  congregationDefaults: congregationDefaultsSchema.optional(),
  createdAt: z.any().optional(),
});
export type Ward = z.infer<typeof wardSchema>;

export const letterTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});
export type LetterTemplate = z.infer<typeof letterTemplateSchema>;
