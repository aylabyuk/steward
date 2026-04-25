import type { ProgramTemplateKey } from "@/lib/types";
import { bold, chip, h, italic, li, p, quote, stringify, text, ul } from "./lexicalNodeBuilders";

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
  ul(
    li(p(bold("Speaker 1: "), chip("speaker1"))),
    li(p(bold("Speaker 2: "), chip("speaker2"))),
    li(p(bold("Mid-meeting interlude: "), chip("midMeetingInterlude"))),
    li(p(bold("Speaker 3: "), chip("speaker3"))),
    li(p(bold("Speaker 4: "), chip("speaker4"))),
  ),

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
