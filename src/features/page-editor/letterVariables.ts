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

/** Sample-value bag the editor uses while authoring — render-time
 *  interpolation in `{{token}}` strings shows the bishop what the
 *  letter will look like for a real speaker without committing
 *  any of these strings to the saved template. The actual per-
 *  speaker render path overrides this via `LetterRenderContextProvider`. */
export const LETTER_VARIABLE_SAMPLES: Readonly<Record<string, string>> = {
  speakerName: "Brother Park",
  topic: "On the still small voice",
  date: "Sunday, May 31, 2026",
  wardName: "Test Ward",
  inviterName: "Bishop Reeves",
  today: "April 26, 2026",
};
