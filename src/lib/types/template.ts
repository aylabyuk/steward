import { z } from "zod";

/**
 * Ward-level editable template for the speaker invitation letter.
 *
 * The letter renders with a fixed chrome (ornament / eyebrow / title /
 * subtitle / rule / date / callout / signature line / footer rule)
 * around two Markdown blocks authored by the bishopric or clerks:
 *
 * - `bodyMarkdown` sits between the date and the "With gratitude,"
 *   signature — the greeting + letter body.
 * - `footerMarkdown` is the single-line scripture at the bottom.
 *
 * Variables in Markdown (`{{speakerName}}`, `{{topic}}`, `{{date}}`,
 * `{{wardName}}`, `{{inviterName}}`, `{{today}}`) are interpolated at
 * render time — see `src/features/templates/interpolate.ts`.
 */
export const speakerLetterTemplateSchema = z.object({
  bodyMarkdown: z.string(),
  footerMarkdown: z.string(),
  updatedAt: z.any().optional(),
});
export type SpeakerLetterTemplate = z.infer<typeof speakerLetterTemplateSchema>;
