import { z } from "zod";

export const personSchema = z.object({
  name: z.string().min(1),
  email: z.email().optional(),
  phone: z.string().optional(),
});
export type Person = z.infer<typeof personSchema>;

// `person` accepts present-as-object, present-as-null, AND absent. The
// missing-key variant happens when a clear path uses Firestore's
// `deleteField()` to wipe the person — the resulting doc has the
// assignment object but no `person` key, which Zod's `nullable()`
// rejects. Tolerating absence here keeps existing meetings parseable;
// new writes should still prefer `person: null` (see `clearPrayerParticipant`).
export const assignmentSchema = z.object({
  person: personSchema.nullish(),
  confirmed: z.boolean().default(false),
});
export type Assignment = z.infer<typeof assignmentSchema>;

export function emptyAssignment(): Assignment {
  return { person: null, confirmed: false };
}
