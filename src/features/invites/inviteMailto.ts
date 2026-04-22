interface InviteMailtoArgs {
  email: string;
  wardName: string;
  wardId: string;
  /** Pre-rendered greeting body (template/override already interpolated). */
  messageBody: string;
}

/**
 * Open the user's email client with a pre-filled invitation. The body
 * is the authored greeting + a fixed tail that carries the accept URL
 * and "— Sent from Steward" signature, so the bishop can't accidentally
 * omit the sign-in link. `mailto:` keeps the app within its
 * "no server-side email" constraint.
 */
export function openInviteMailto(args: InviteMailtoArgs): void {
  const acceptUrl = `${window.location.origin}/accept-invite/${encodeURIComponent(args.wardId)}`;
  const subject = `You're invited to help plan ${args.wardName} sacrament meetings`;
  const body = [
    args.messageBody.trimEnd(),
    "",
    "To accept, sign in with this email and then open the link below:",
    acceptUrl,
    "",
    "— Sent from Steward",
  ].join("\n");
  window.location.href = `mailto:${encodeURIComponent(
    args.email,
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
