interface InviteMailtoArgs {
  email: string;
  displayName: string;
  wardName: string;
  wardId: string;
  inviterName: string;
}

/**
 * Open the user's email client with a pre-filled invitation message.
 * Using mailto: keeps the app within its "no server-side email" constraint.
 */
export function openInviteMailto(args: InviteMailtoArgs): void {
  const acceptUrl = `${window.location.origin}/accept-invite/${encodeURIComponent(args.wardId)}`;
  const subject = `You're invited to help plan ${args.wardName} sacrament meetings`;
  const body = [
    `Hi ${args.displayName},`,
    "",
    `${args.inviterName} has invited you to help plan sacrament meetings for ${args.wardName} in Steward.`,
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
