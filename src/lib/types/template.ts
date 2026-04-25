import { z } from "zod";

/**
 * Ward-level editable template for the speaker invitation letter.
 *
 * Shipping migration: the WYSIWYG editor stores the letter as a single
 * Lexical EditorState JSON in `editorStateJson` (greeting + body +
 * callout + signature + closing scripture all flow as one document).
 * The legacy `bodyMarkdown` / `footerMarkdown` pair is dual-written
 * for ~30 days so older readers (Cloud Functions, receipt-email
 * payloads, the print path while in flight) keep working. Once the
 * read-side is fully JSON-aware we'll drop the markdown fields in a
 * follow-up cleanup.
 *
 * Variables in either representation use the same `{{token}}` syntax
 * (`{{speakerName}}`, `{{topic}}`, `{{date}}`, `{{wardName}}`,
 * `{{inviterName}}`, `{{today}}`) — interpolation happens at render
 * time. See `src/features/templates/interpolate.ts`.
 */
export const letterPageStyleSchema = z.object({
  borderColor: z.enum(["none", "walnut", "brass-deep", "bordeaux"]).default("none"),
  borderWidth: z.number().min(0).max(4).default(0),
  borderStyle: z.enum(["solid", "double", "rule-and-ornament"]).default("solid"),
  paper: z.enum(["chalk", "parchment", "parchment-2"]).default("chalk"),
});
export type LetterPageStyle = z.infer<typeof letterPageStyleSchema>;

export const speakerLetterTemplateSchema = z.object({
  /** Lexical EditorState as a JSON string. New WYSIWYG storage. */
  editorStateJson: z.string().optional(),
  /** Optional page-frame style (border + paper) — applied on the
   *  PageCanvas wrapper, not as Lexical content. */
  pageStyle: letterPageStyleSchema.nullable().optional(),
  /** Legacy fields, kept readable + dual-written for ~30 days. */
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

/**
 * Shared shape for server-side messaging templates (SMS + email
 * bodies sent by Cloud Functions). Each template lives at
 * `wards/{wardId}/templates/{key}` and exposes the same
 * `bodyMarkdown` + `updatedAt` pair the letter / email / invite
 * templates already use. Six keys — see `MESSAGE_TEMPLATE_KEYS`.
 *
 * Templates govern only the authored narrative text; the structural
 * framing around response-receipt emails (the inline letter excerpt,
 * the divider rules, the "View in Steward" link, the warning text)
 * stays hardcoded in the Cloud Function so bishoprics don't have to
 * author HTML wrappers.
 */
export const messageTemplateSchema = z.object({
  bodyMarkdown: z.string(),
  updatedAt: z.any().optional(),
});
export type MessageTemplate = z.infer<typeof messageTemplateSchema>;

export const MESSAGE_TEMPLATE_KEYS = [
  "initialInvitationSms",
  "speakerResponseAccepted",
  "speakerResponseDeclined",
  "bishopricResponseReceipt",
  "bishopReplySms",
  "bishopReplyEmail",
] as const;
export type MessageTemplateKey = (typeof MESSAGE_TEMPLATE_KEYS)[number];

/**
 * Ward-level editable template for the printed sacrament-meeting
 * program (conducting copy + congregation copy). Stored as a Lexical
 * EditorState JSON string instead of markdown so the rich custom
 * nodes the editor introduces (variable chips today; hymn / script /
 * leadership blocks tomorrow) round-trip with full fidelity. The
 * print pages walk this state and render each node, resolving
 * variable chips against the meeting + ward + speaker data.
 */
export const programMarginsSchema = z.object({
  top: z.number().min(0.25).max(2),
  right: z.number().min(0.25).max(2),
  bottom: z.number().min(0.25).max(2),
  left: z.number().min(0.25).max(2),
});
export type ProgramMargins = z.infer<typeof programMarginsSchema>;

export const programTemplateSchema = z.object({
  editorStateJson: z.string(),
  /** Page margins in inches. Optional for back-compat with templates
   *  saved before the margin editor shipped — falls back to the
   *  variant's built-in default at render time. */
  margins: programMarginsSchema.optional(),
  updatedAt: z.any().optional(),
});
export type ProgramTemplate = z.infer<typeof programTemplateSchema>;

export const PROGRAM_TEMPLATE_KEYS = ["conductingProgram", "congregationProgram"] as const;
export type ProgramTemplateKey = (typeof PROGRAM_TEMPLATE_KEYS)[number];
