/** Variable surface for the speaker-letter editor. Mirrors the keys
 *  in `SpeakerLetterVars` (see `src/features/templates/interpolate.ts`)
 *  so the chip set the bishop can insert at authoring time matches
 *  what the renderer resolves at print + email time. The `sample`
 *  value previews per row in the Variables dropdown so the bishop
 *  can see what the chip would resolve to without inserting it. */
export interface LetterVariable {
  token: string;
  label: string;
  group: "speaker" | "context";
  sample: string;
}

export const LETTER_VARIABLES: readonly LetterVariable[] = [
  { token: "speakerName", label: "Speaker name", group: "speaker", sample: "Brother Park" },
  { token: "topic", label: "Topic", group: "speaker", sample: "On the still small voice" },
  { token: "date", label: "Assigned Sunday", group: "speaker", sample: "Sunday, May 31, 2026" },
  { token: "wardName", label: "Ward name", group: "context", sample: "Test Ward" },
  { token: "inviterName", label: "Inviter name", group: "context", sample: "Bishop Reeves" },
  { token: "today", label: "Today's date", group: "context", sample: "April 26, 2026" },
];

export const LETTER_VARIABLE_GROUP_LABEL: Record<LetterVariable["group"], string> = {
  speaker: "Speaker",
  context: "Context",
};

/** Sample-value bag the editor uses while authoring — render-time
 *  interpolation in `{{token}}` strings shows the bishop what the
 *  letter will look like for a real speaker without committing
 *  any of these strings to the saved template. Derived from
 *  `LETTER_VARIABLES` so the dropdown previews and the rendered
 *  template share one source of truth. The actual per-speaker
 *  render path overrides this via `LetterRenderContextProvider`. */
export const LETTER_VARIABLE_SAMPLES: Readonly<Record<string, string>> = Object.fromEntries(
  LETTER_VARIABLES.map((v) => [v.token, v.sample]),
);
