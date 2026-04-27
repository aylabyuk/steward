import type { LetterVariable } from "./letterVariables";

/** Variable surface for the prayer-letter editor. Mirrors
 *  LETTER_VARIABLES but swaps the speaker-shaped tokens (`speakerName`,
 *  `topic`) for prayer-shaped ones (`prayerGiverName`, `prayerType`).
 *  The 4 context tokens (`date`, `wardName`, `inviterName`, `today`)
 *  carry over identically.
 *
 *  `prayerType` resolves to "opening prayer" or "benediction" based
 *  on the prayer participant's role at render / send time. */
export const PRAYER_LETTER_VARIABLES: readonly LetterVariable[] = [
  {
    token: "prayerGiverName",
    label: "Prayer-giver name",
    group: "speaker",
    sample: "Sister Reyes",
  },
  {
    token: "prayerType",
    label: "Prayer type",
    group: "speaker",
    sample: "opening prayer",
  },
  { token: "date", label: "Assigned Sunday", group: "speaker", sample: "Sunday, May 17, 2026" },
  { token: "wardName", label: "Ward name", group: "context", sample: "Test Ward" },
  { token: "inviterName", label: "Inviter name", group: "context", sample: "Bishop Reeves" },
  { token: "today", label: "Today's date", group: "context", sample: "April 27, 2026" },
];

export const PRAYER_LETTER_VARIABLE_GROUP_LABEL: Record<LetterVariable["group"], string> = {
  speaker: "Prayer",
  context: "Context",
};

export const PRAYER_LETTER_VARIABLE_SAMPLES: Readonly<Record<string, string>> = Object.fromEntries(
  PRAYER_LETTER_VARIABLES.map((v) => [v.token, v.sample]),
);
