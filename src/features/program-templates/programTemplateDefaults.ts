import type { ProgramTemplateKey } from "@/lib/types";

/* -------------------------------------------------------------- */
/* Tiny serialised-Lexical-node builders                          */
/* -------------------------------------------------------------- */
/*  We write the default templates by composing little JSON-like  */
/*  objects rather than hand-typing the whole SerializedEditorState  */
/*  blob — keeps the source readable and lets us add new templates  */
/*  later without copy-pasting `version: 1` everywhere.            */

interface JsonNode {
  type: string;
  version: number;
  [key: string]: unknown;
}

const COMMON = { format: "", indent: 0, direction: null } as const;
const TEXT_BASE = { format: 0, mode: "normal", style: "", detail: 0 } as const;

const text = (value: string, format: 0 | 1 | 2 | 3 = 0): JsonNode => ({
  type: "text",
  version: 1,
  ...TEXT_BASE,
  text: value,
  format,
});
const bold = (value: string) => text(value, 1);
const italic = (value: string) => text(value, 2);
const chip = (token: string): JsonNode => ({ type: "variable-chip", version: 1, token });
const p = (...children: JsonNode[]): JsonNode => ({
  type: "paragraph",
  version: 1,
  ...COMMON,
  children,
});
const h = (level: 1 | 2 | 3, ...children: JsonNode[]): JsonNode => ({
  type: "heading",
  version: 1,
  ...COMMON,
  tag: `h${level}`,
  children,
});
const quote = (...children: JsonNode[]): JsonNode => ({
  type: "quote",
  version: 1,
  ...COMMON,
  children,
});
const li = (...children: JsonNode[]): JsonNode => ({
  type: "listitem",
  version: 1,
  ...COMMON,
  value: 1,
  children,
});
const ul = (...items: JsonNode[]): JsonNode => ({
  type: "list",
  version: 1,
  ...COMMON,
  listType: "bullet",
  start: 1,
  tag: "ul",
  children: items,
});

const stringify = (children: JsonNode[]): string =>
  JSON.stringify({
    root: { type: "root", version: 1, ...COMMON, children },
  });

/* -------------------------------------------------------------- */
/* Defaults                                                       */
/* -------------------------------------------------------------- */

const conducting = stringify([
  h(1, text("Conductor's copy")),
  p(chip("wardName"), text(" · "), chip("date")),

  quote(
    italic("Welcome to sacrament meeting of the "),
    chip("wardName"),
    italic(". Today is "),
    chip("date"),
    italic("."),
  ),

  h(3, text("Leadership")),
  ul(
    li(p(bold("Presiding: "), chip("presiding"))),
    li(p(bold("Conducting: "), chip("conducting"))),
    li(p(bold("Visitors: "), chip("visitors"))),
  ),

  h(3, text("Announcements")),
  p(chip("announcements")),

  h(3, text("Music")),
  ul(li(p(bold("Pianist: "), chip("pianist"))), li(p(bold("Chorister: "), chip("chorister")))),

  h(3, text("Opening")),
  ul(
    li(p(bold("Opening hymn: "), chip("openingHymn"))),
    li(p(bold("Invocation: "), chip("openingPrayer"))),
  ),

  h(3, text("Ward & stake business")),
  ul(
    li(p(bold("Ward business: "), chip("wardBusiness"))),
    li(p(bold("Stake business: "), chip("stakeBusiness"))),
  ),

  quote(italic("We will now turn our thoughts to the sacred ordinance of the sacrament.")),

  h(3, text("Sacrament")),
  ul(li(p(bold("Sacrament hymn: "), chip("sacramentHymn")))),

  quote(
    italic("Thank the congregation for their reverence. Introduce "),
    chip("speaker1"),
    italic(" and the musical number that follows."),
  ),

  h(3, text("Speakers")),
  p(chip("speakersSequence")),

  quote(
    italic("Thank earlier participants. Introduce "),
    chip("speaker2"),
    italic(", then mention the closing hymn and benediction."),
  ),

  h(3, text("Closing")),
  ul(
    li(p(bold("Closing hymn: "), chip("closingHymn"))),
    li(p(bold("Benediction: "), chip("benediction"))),
  ),
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
  p(chip("speakersSequence")),

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
