import { z } from "zod";

export const CALLINGS = [
  "bishop",
  "first_counselor",
  "second_counselor",
  "executive_secretary",
  "assistant_executive_secretary",
  "ward_clerk",
  "assistant_clerk",
] as const;
export const callingSchema = z.enum(CALLINGS);
export type Calling = z.infer<typeof callingSchema>;

export const ROLES = ["bishopric", "clerk"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export function callingToRole(calling: Calling): Role {
  if (calling === "bishop" || calling === "first_counselor" || calling === "second_counselor") {
    return "bishopric";
  }
  return "clerk";
}

export const fcmTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(["web", "ios", "android"]).default("web"),
  updatedAt: z.any(),
});
export type FcmToken = z.infer<typeof fcmTokenSchema>;

export const notificationPrefsSchema = z.object({
  enabled: z.boolean().default(true),
  quietHours: z
    .object({
      startHour: z.number().int().min(0).max(23),
      endHour: z.number().int().min(0).max(23),
    })
    .optional(),
});
export type NotificationPrefs = z.infer<typeof notificationPrefsSchema>;

export const memberSchema = z.object({
  email: z.email(),
  displayName: z.string().min(1),
  /** Google profile picture URL captured at sign-in; refreshed on each
   *  subsequent sign-in so avatar bubbles everywhere else in the app
   *  can show the real face instead of initials. Optional — speakers
   *  invited via the public link may not have one on file yet. */
  photoURL: z.string().optional(),
  calling: callingSchema,
  role: roleSchema,
  active: z.boolean().default(true),
  ccOnEmails: z.boolean().default(true),
  fcmTokens: z.array(fcmTokenSchema).default([]),
  notificationPrefs: notificationPrefsSchema.optional(),
  createdAt: z.any().optional(),
  updatedAt: z.any().optional(),
});
export type Member = z.infer<typeof memberSchema>;
