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

/**
 * Ward-level editable template for the ward-member invitation message.
 *
 * Single Markdown block authored by the bishopric/clerks. Renders as a
 * greeting at the top of the accept-invite page AND as the body of the
 * `mailto:` link the bishop sends. The accept URL, sign-in prompt, and
 * "— Sent from Steward" signature are appended automatically so the
 * template can focus on the personal greeting.
 *
 * Variables: `{{inviteeName}}`, `{{wardName}}`, `{{inviterName}}`,
 * `{{calling}}` (pretty-printed), `{{role}}` (`bishopric` | `clerk`).
 */
export const wardInviteTemplateSchema = z.object({
  bodyMarkdown: z.string(),
  updatedAt: z.any().optional(),
});
export type WardInviteTemplate = z.infer<typeof wardInviteTemplateSchema>;
