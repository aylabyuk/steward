import { z } from "zod";

export const commentSchema = z.object({
  authorUid: z.string().min(1),
  authorDisplayName: z.string().min(1),
  body: z.string().min(1),
  mentionedUids: z.array(z.string()).default([]),
  createdAt: z.any(),
  editedAt: z.any().optional(),
  deletedAt: z.any().optional(),
});
export type Comment = z.infer<typeof commentSchema>;
