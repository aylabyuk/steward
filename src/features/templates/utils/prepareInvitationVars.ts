/** Variable shape for PrepareInvitationDialog's letter tab. The
 *  dialog computes vars once and the letter preview interpolates them
 *  identically to what a send would produce. Required keys cover the
 *  speaker-shaped letter chrome (date / wardName / inviterName); the
 *  index signature lets prayer invitations layer in extra tokens
 *  (`prayerGiverName`, `prayerType`) without a separate type. */
export type LetterVars = {
  speakerName: string;
  date: string;
  today: string;
  wardName: string;
  inviterName: string;
  topic?: string;
  [key: string]: string | undefined;
};
