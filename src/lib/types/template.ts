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

/**
 * Ward-level editable template for the **speaker email body** — the
 * plain-text message that goes into the `mailto:` when a bishop clicks
 * "Send email" for a planned speaker. Distinct from the speaker letter
 * template (which governs the rich letter on the public landing page):
 * this is what lands in the recipient's inbox before they click the
 * link. A good default names purpose, sender, and Sunday upfront so
 * the email doesn't read like a phishing attempt.
 *
 * Variables: `{{speakerName}}`, `{{date}}`, `{{wardName}}`,
 * `{{inviterName}}`, `{{topic}}`, `{{inviteUrl}}`.
 */
export const speakerEmailTemplateSchema = z.object({
  bodyMarkdown: z.string(),
  updatedAt: z.any().optional(),
});
export type SpeakerEmailTemplate = z.infer<typeof speakerEmailTemplateSchema>;
