/** Shared variable shapes for PrepareInvitationDialog's letter and
 *  email tabs. The dialog computes vars once and passes them to each
 *  tab so the preview interpolates identically to what a send would
 *  produce. `inviteUrl` is only known post-send; the preview shows a
 *  placeholder so the author can see where the URL will land. */
export interface LetterVars {
  speakerName: string;
  topic: string;
  date: string;
  today: string;
  wardName: string;
  inviterName: string;
}

export interface EmailVars extends LetterVars {
  inviteUrl: string;
}
