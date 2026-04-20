import { z } from "zod";

export const HISTORY_TARGETS = ["meeting", "speaker", "comment", "approval"] as const;
export const HISTORY_ACTIONS = ["create", "update", "delete"] as const;

export const historyChangeSchema = z.object({
  field: z.string(),
  old: z.unknown().optional(),
  new: z.unknown().optional(),
});
export type HistoryChange = z.infer<typeof historyChangeSchema>;

export const historyEventSchema = z.object({
  actorUid: z.string().min(1),
  actorDisplayName: z.string().min(1),
  at: z.any(),
  target: z.enum(HISTORY_TARGETS),
  targetId: z.string().min(1),
  action: z.enum(HISTORY_ACTIONS),
  changes: z.array(historyChangeSchema).default([]),
});
export type HistoryEvent = z.infer<typeof historyEventSchema>;
