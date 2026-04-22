import { z } from "zod";
import { callingSchema, roleSchema } from "./member";

/**
 * A pending ward-membership invite. Keyed by the invitee's (lower-cased)
 * email so the acceptance rule can verify membership with a simple
 * exists() + get() lookup against request.auth.token.email.
 *
 * On acceptance the invitee's client writes a members/{uid} doc whose
 * email / role / calling match this invite, then deletes the invite.
 */
export const inviteSchema = z.object({
  email: z.email(),
  displayName: z.string().min(1),
  calling: callingSchema,
  role: roleSchema,
  // Ward name snapshotted at invite time so the accept-invite page can
  // display it without needing to read the ward doc (the invitee isn't
  // a member yet, so the ward doc would be unreadable per rules).
  wardName: z.string().min(1).default(""),
  invitedBy: z.string().min(1),
  invitedByName: z.string().min(1),
  invitedAt: z.any(),
  // Pre-rendered Markdown greeting snapshotted at send time (ward
  // template or per-invite override, with variables interpolated). The
  // accept page reads this without needing to read the template doc
  // (which the invitee can't access — they're not a member yet).
  messageBody: z.string().optional(),
});
export type Invite = z.infer<typeof inviteSchema>;
