import { CALLING_LABELS } from "@/features/settings/callingLabels";
import type { Calling, Role } from "@/lib/types";
import { interpolate } from "./interpolate";
import { DEFAULT_WARD_INVITE_BODY } from "./wardInviteDefaults";

export interface WardInviteMessageVars {
  inviteeName: string;
  wardName: string;
  inviterName: string;
  calling: Calling;
  role: Role;
}

/**
 * Resolve the greeting body for an outgoing ward-member invite.
 * Precedence: per-invite override → ward template → seed default.
 * Variables are interpolated here so the returned string can be
 * snapshotted onto the invite doc (the invitee can't read the template
 * doc) and reused verbatim for the `mailto:` body.
 */
export function renderWardInviteMessage(
  vars: WardInviteMessageVars,
  sources: { override?: string | null | undefined; template?: string | null | undefined },
): string {
  const source = sources.override?.trim() || sources.template?.trim() || DEFAULT_WARD_INVITE_BODY;
  return interpolate(source, {
    inviteeName: vars.inviteeName,
    wardName: vars.wardName,
    inviterName: vars.inviterName,
    calling: CALLING_LABELS[vars.calling],
    role: vars.role,
  });
}
