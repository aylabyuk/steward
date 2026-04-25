import type { ProgramVariable } from "@/features/program-templates/programVariables";

/** Variable surface for the speaker invitation letter. The tokens
 *  match `interpolate()`'s known keys consumed by the existing
 *  `LetterCanvas` / `usePrepareInvitation` flow, so the markdown the
 *  editor produces lands cleanly into the rendered letter without
 *  any rename gymnastics downstream. */
export const SPEAKER_LETTER_VARIABLES: readonly ProgramVariable[] = [
  { token: "speakerName", label: "Speaker name", group: "speaker", sample: "Sister Reeves" },
  { token: "topic", label: "Topic", group: "speaker", sample: "On the still, small voice" },
  { token: "date", label: "Assigned Sunday", group: "meeting", sample: "Sunday, May 31, 2026" },
  { token: "today", label: "Today's date", group: "meeting", sample: "April 25, 2026" },
  { token: "wardName", label: "Ward name", group: "meeting", sample: "Test Ward" },
  { token: "inviterName", label: "Inviter (signing)", group: "meeting", sample: "Bishop Reeves" },
] as const;

export const SPEAKER_LETTER_GROUP_LABEL: Readonly<Record<string, string>> = {
  speaker: "Speaker",
  meeting: "Meeting",
};
