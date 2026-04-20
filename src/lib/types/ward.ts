import { z } from "zod";
import { meetingTypeSchema } from "./meeting";

export const nudgeSlotSchema = z.object({
  enabled: z.boolean(),
  hour: z.number().int().min(0).max(23),
});
export type NudgeSlot = z.infer<typeof nudgeSlotSchema>;

export const nudgeScheduleSchema = z.object({
  wednesday: nudgeSlotSchema,
  friday: nudgeSlotSchema,
  saturday: nudgeSlotSchema,
});
export type NudgeSchedule = z.infer<typeof nudgeScheduleSchema>;

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
  nudgeSchedule: nudgeScheduleSchema.default({
    wednesday: { enabled: true, hour: 19 },
    friday: { enabled: true, hour: 19 },
    saturday: { enabled: false, hour: 9 },
  }),
  emailCcDefaults: z.record(z.string(), z.boolean()).default({}),
  defaultPianistUid: z.string().optional(),
});
export type WardSettings = z.infer<typeof wardSettingsSchema>;

export const wardSchema = z.object({
  name: z.string().min(1),
  settings: wardSettingsSchema,
  createdAt: z.any().optional(),
});
export type Ward = z.infer<typeof wardSchema>;

export const letterTemplateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  body: z.string().min(1),
});
export type LetterTemplate = z.infer<typeof letterTemplateSchema>;
