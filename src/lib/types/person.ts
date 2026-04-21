import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
});
export type Person = z.infer<typeof personSchema>;

export const assignmentSchema = z.object({
  person: personSchema.nullable(),
  confirmed: z.boolean().default(false),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export function emptyAssignment(): Assignment {
  return { person: null, confirmed: false };
}
