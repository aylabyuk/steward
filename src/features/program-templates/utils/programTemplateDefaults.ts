import type { ProgramTemplateKey } from "@/lib/types";
import { bold, chip, h, li, p, stringify, text, ul, type JsonNode } from "./lexicalNodeBuilders";

// Local extensions to the shared builders — keep them here rather
// than the shared module so only the conducting + congregation
// defaults pay the styling tax. `centered` is a paragraph with
// `format: "center"`; `styledText` lets us pre-bake an inline
// `style="..."` so the bishop opens the editor to a typography
// rhythm that already feels finished (small mono eyebrows, smaller
// stage-cue italics, etc).
function centered(...children: JsonNode[]): JsonNode {
  return { type: "paragraph", version: 1, format: "center", indent: 0, direction: null, children };
}
function styledText(value: string, style: string, format: 0 | 1 | 2 | 3 = 0): JsonNode {
  return {
    type: "text",
    version: 1,
    format,
    mode: "normal",
    style,
    detail: 0,
    text: value,
  };
}
function hr(): JsonNode {
  return { type: "horizontalrule", version: 1 };
}

// Typography presets — kept as constants so a future tweak doesn't
// require sweeping the JSON.
const EYEBROW_STYLE =
  "font-family: var(--font-mono); font-size: 9.5px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-walnut-3);";
const SECTION_STYLE =
  "font-family: var(--font-mono); font-size: 10.5px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--color-brass-deep);";
const META_STYLE =
  "font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em; color: var(--color-walnut-3);";
const CUE_STYLE = "font-size: 13px; color: var(--color-walnut-3);";

// Eyebrow-style chip (forces the chip's display to inherit the
// surrounding eyebrow / meta typography instead of the page default).
function styledChip(token: string, style: string): JsonNode {
  return { type: "variable-chip", version: 3, token, format: 0, style };
}

// Builder for a numbered agenda row — "N · Label — value" without
// using a list node (lists waste horizontal space and visually
// compete with chip values in this dense layout).
function agendaRow(num: string, label: string, valueChip: string): JsonNode {
  return p(bold(`${num.padEnd(2)}  ${label} — `), chip(valueChip));
}
function subRow(label: string, valueChip: string): JsonNode {
  return p(bold(`     ${label} — `), chip(valueChip));
}
function cueRow(value: string): JsonNode {
  return p(styledText(`     ${value}`, CUE_STYLE, 2));
}

const conducting = stringify([
  // Compact masthead — small eyebrow, italic title, meta line
  centered(styledText("CONDUCTING COPY", EYEBROW_STYLE)),
  centered(styledText("Sacrament meeting", "font-size: 22px; font-style: italic;")),
  centered(
    styledChip("wardName", META_STYLE),
    styledText("  ·  ", META_STYLE),
    styledChip("date", META_STYLE),
  ),

  hr(),

  // Officers — paired on the same row to save vertical space.
  // Wide tabular separator between pairs keeps the chip values
  // visually grouped without needing an actual table.
  p(styledText("Officers", SECTION_STYLE)),
  p(bold("Presiding · "), chip("presiding"), bold("     ·     Conducting · "), chip("conducting")),
  p(bold("Pianist · "), chip("pianist"), bold("     ·     Chorister · "), chip("chorister")),
  p(bold("Visitors · "), chip("visitors")),

  hr(),

  // Order of meeting — numbered linear flow, stage cues inline as
  // smaller italic rows directly under the agenda line they belong to
  p(styledText("Order of meeting", SECTION_STYLE)),

  agendaRow("1", "Announcements", "announcements"),

  agendaRow("2", "Opening hymn", "openingHymn"),
  subRow("Invocation", "openingPrayer"),

  agendaRow("3", "Ward business", "wardBusiness"),
  subRow("Stake business", "stakeBusiness"),

  agendaRow("4", "Sacrament hymn", "sacramentHymn"),
  cueRow("Administration of the sacrament — pause for reverence before introducing speakers."),

  agendaRow("5", "Speaker", "speaker1"),
  cueRow("Welcome the congregation; introduce the speaker briefly."),

  agendaRow("6", "Musical interlude", "midMeetingInterlude"),

  agendaRow("7", "Speaker", "speaker2"),
  cueRow("Thank the previous speaker; mention the closing hymn that follows."),

  agendaRow("8", "Closing hymn", "closingHymn"),
  subRow("Benediction", "benediction"),
]);

const congregation = stringify([
  h(1, text("Sacrament meeting")),
  p(chip("wardName"), text(" · "), chip("date")),

  h(3, text("Presiding & conducting")),
  ul(
    li(p(bold("Presiding: "), chip("presiding"))),
    li(p(bold("Conducting: "), chip("conducting"))),
    li(p(bold("Visitors: "), chip("visitors"))),
  ),

  h(3, text("Music")),
  ul(li(p(bold("Pianist: "), chip("pianist"))), li(p(bold("Chorister: "), chip("chorister")))),

  h(3, text("Opening")),
  ul(
    li(p(bold("Opening hymn: "), chip("openingHymn"))),
    li(p(bold("Invocation: "), chip("openingPrayer"))),
  ),

  h(3, text("Sacrament")),
  ul(li(p(bold("Sacrament hymn: "), chip("sacramentHymn")))),

  h(3, text("Speakers & music")),
  ul(
    li(p(bold("Speaker 1: "), chip("speaker1"))),
    li(p(bold("Speaker 2: "), chip("speaker2"))),
    li(p(bold("Mid-meeting interlude: "), chip("midMeetingInterlude"))),
    li(p(bold("Speaker 3: "), chip("speaker3"))),
    li(p(bold("Speaker 4: "), chip("speaker4"))),
  ),

  h(3, text("Closing")),
  ul(
    li(p(bold("Closing hymn: "), chip("closingHymn"))),
    li(p(bold("Benediction: "), chip("benediction"))),
  ),
]);

/** Built-in fallbacks for the program templates. Used when no ward
 *  override exists at `wards/{wardId}/templates/{key}` — a brand-new
 *  ward already gets a sensible printed program before anyone touches
 *  the editor. Stored as Lexical EditorState JSON strings so the
 *  shape matches what `writeProgramTemplate` saves. */
export const DEFAULT_PROGRAM_TEMPLATES: Record<ProgramTemplateKey, string> = {
  conductingProgram: conducting,
  congregationProgram: congregation,
};

export function defaultProgramTemplate(key: ProgramTemplateKey): string {
  return DEFAULT_PROGRAM_TEMPLATES[key];
}
