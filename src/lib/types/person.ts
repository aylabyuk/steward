import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
});
export type Person = z.infer<typeof personSchema>;

export const ASSIGNMENT_STATUSES = [
  "not_assigned",
  "draft",
  "invite_printed",
  "invite_emailed",
  "notified",
  "accepted",
  "declined",
  "completed",
] as const;
export const assignmentStatusSchema = z.enum(ASSIGNMENT_STATUSES);
export type AssignmentStatus = z.infer<typeof assignmentStatusSchema>;

export const assignmentSchema = z.object({
  person: personSchema.nullable(),
  status: assignmentStatusSchema,
});
export type Assignment = z.infer<typeof assignmentSchema>;
