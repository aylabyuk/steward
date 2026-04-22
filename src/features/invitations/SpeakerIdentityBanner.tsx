import { cn } from "@/lib/cn";

interface Props {
  /** The email on the invitation — what the bishop originally sent to. */
  expectedEmail: string | undefined;
  /** The email the speaker actually signed in with, pulled from Twilio
   *  participant attributes or invitation.response.actorEmail. */
  actualEmail: string | undefined;
}

/** Compact identity cue for the bishop-side chat pane.
 *  - Green: speaker signed in with the same email the invitation
 *    was sent to. Verified.
 *  - Amber: speaker signed in, but with a different email than the
 *    invitation targeted. Possibly expected (e.g., testing account)
 *    but worth flagging.
 *  - Muted: nobody has signed in yet / no email available. */
export function SpeakerIdentityBanner({ expectedEmail, actualEmail }: Props) {
  if (!actualEmail) {
    return (
      <div className="px-4 py-2 border-b border-border bg-parchment-2">
        <p className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-3">
          Speaker has not signed in yet
        </p>
      </div>
    );
  }

  const matches = Boolean(
    expectedEmail && expectedEmail.toLowerCase() === actualEmail.toLowerCase(),
  );

  return (
    <div
      className={cn(
        "px-4 py-2 border-b",
        matches ? "bg-success-soft border-success-soft" : "bg-brass-soft/30 border-brass-soft",
      )}
    >
      <p
        className={cn(
          "font-mono text-[10.5px] uppercase tracking-[0.14em] font-medium",
          matches ? "text-success" : "text-brass-deep",
        )}
      >
        {matches ? "Speaker verified" : "Signed in with a different account"}
      </p>
      <p className="font-sans text-[12.5px] text-walnut mt-0.5">
        <span className="font-semibold">{actualEmail}</span>
        {!matches && expectedEmail && (
          <>
            <span className="text-walnut-3"> — invited </span>
            <span className="font-semibold text-walnut-2">{expectedEmail}</span>
          </>
        )}
      </p>
    </div>
  );
}
