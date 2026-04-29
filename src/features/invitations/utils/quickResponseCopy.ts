/** Speaker-side quick-response copy. The response message body is
 *  persisted in Twilio and shows up in both the speaker's and the
 *  bishopric's chat history forever, so it has to read as accurate
 *  for the slot kind — a prayer-giver who taps Yes shouldn't see
 *  "Yes, I can speak." in their own audit trail.
 *
 *  Lives in /utils so a vitest can pin every branch without having
 *  to mount the React component. */

export type ResponseKind = "speaker" | "prayer";

/** Audit-trail body posted to Twilio when the speaker submits. */
export function formatResponseBody(args: {
  answer: "yes" | "no";
  kind: ResponseKind;
  reasonText?: string;
}): string {
  const { answer, kind, reasonText } = args;
  if (answer === "yes") {
    return kind === "prayer" ? "Yes, I can offer the prayer." : "Yes, I can speak.";
  }
  if (reasonText) return `No — ${reasonText}`;
  return "No, I can't.";
}

/** "Can you speak on Sun May 20?" / "Can you offer the prayer on Sun May 20?" */
export function formatResponsePrompt(args: {
  kind: ResponseKind;
  shortSunday: string;
}): string {
  const verb = args.kind === "prayer" ? "offer the prayer" : "speak";
  return `Can you ${verb} on ${args.shortSunday}?`;
}

/** Yes-button label. "Yes, I can speak" / "Yes, I can offer the prayer". */
export function formatYesButtonLabel(kind: ResponseKind): string {
  return kind === "prayer" ? "Yes, I can offer the prayer" : "Yes, I can speak";
}
