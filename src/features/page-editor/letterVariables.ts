/** Variable surface for the speaker-letter editor. Mirrors the keys
 *  in `SpeakerLetterVars` (see `src/features/templates/interpolate.ts`)
 *  so the chip set the bishop can insert at authoring time matches
 *  what the renderer resolves at print + email time. */
export interface LetterVariable {
  token: string;
  label: string;
  group: "speaker" | "context";
}

export const LETTER_VARIABLES: readonly LetterVariable[] = [
  { token: "speakerName", label: "Speaker name", group: "speaker" },
  { token: "topic", label: "Topic", group: "speaker" },
  { token: "date", label: "Assigned Sunday", group: "speaker" },
  { token: "wardName", label: "Ward name", group: "context" },
  { token: "inviterName", label: "Inviter name", group: "context" },
  { token: "today", label: "Today's date", group: "context" },
];

export const LETTER_VARIABLE_GROUP_LABEL: Record<LetterVariable["group"], string> = {
  speaker: "Speaker",
  context: "Context",
};
