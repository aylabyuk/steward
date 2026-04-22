/** Variable shape for PrepareInvitationDialog's letter tab. The
 *  dialog computes vars once and the letter preview interpolates them
 *  identically to what a send would produce. Defined as a `type` (not
 *  `interface`) so it's assignable to `Record<string, string>` for
 *  `interpolate()`. */
export type LetterVars = {
  speakerName: string;
  topic: string;
  date: string;
  today: string;
  wardName: string;
  inviterName: string;
};
