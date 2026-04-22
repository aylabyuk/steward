/** Variable shape for PrepareInvitationDialog's letter tab. The
 *  dialog computes vars once and the letter preview interpolates them
 *  identically to what a send would produce. */
export interface LetterVars {
  speakerName: string;
  topic: string;
  date: string;
  today: string;
  wardName: string;
  inviterName: string;
}
