/** The variable surface a program template can reference. Each entry
 *  is the metadata needed both at authoring time (the chip UI in the
 *  editor) and at render time (resolving the chip back into a real
 *  value pulled from the meeting + ward + speakers). The `sample`
 *  value is what the editor's preview shows when no real meeting is
 *  yet wired to the template. */
export interface ProgramVariable {
  token: string;
  label: string;
  group: "meeting" | "leadership" | "hymns" | "speakers" | "free-form";
  sample: string;
}

export const PROGRAM_VARIABLES: readonly ProgramVariable[] = [
  // Meeting metadata
  { token: "date", label: "Meeting date", group: "meeting", sample: "Sunday, May 31, 2026" },
  { token: "wardName", label: "Ward name", group: "meeting", sample: "Test Ward" },
  { token: "meetingType", label: "Meeting type", group: "meeting", sample: "Regular" },

  // Leadership
  { token: "presiding", label: "Presiding", group: "leadership", sample: "Bishop Reeves" },
  { token: "conducting", label: "Conducting", group: "leadership", sample: "Brother Tan" },
  { token: "chorister", label: "Chorister", group: "leadership", sample: "Sister Park" },
  { token: "pianist", label: "Pianist", group: "leadership", sample: "Sister Lee" },

  // Hymns
  {
    token: "openingHymn",
    label: "Opening hymn",
    group: "hymns",
    sample: "#19 — We Thank Thee, O God, for a Prophet",
  },
  {
    token: "sacramentHymn",
    label: "Sacrament hymn",
    group: "hymns",
    sample: "#172 — In Humility, Our Savior",
  },
  {
    token: "closingHymn",
    label: "Closing hymn",
    group: "hymns",
    sample: "#85 — How Firm a Foundation",
  },

  // Speakers
  {
    token: "speaker1",
    label: "Speaker 1",
    group: "speakers",
    sample: "Brother Park — On the still small voice",
  },
  {
    token: "speaker2",
    label: "Speaker 2",
    group: "speakers",
    sample: "Sister Reeves — Faith and works",
  },
  { token: "speaker3", label: "Speaker 3", group: "speakers", sample: "" },
  { token: "speaker4", label: "Speaker 4", group: "speakers", sample: "" },
  {
    token: "midMeetingInterlude",
    label: "Mid-meeting interlude",
    group: "speakers",
    sample: "Musical number — Sister Lee",
  },

  // Free-form
  { token: "openingPrayer", label: "Opening prayer", group: "free-form", sample: "Brother Tan" },
  { token: "benediction", label: "Closing prayer", group: "free-form", sample: "Sister Park" },
  { token: "visitors", label: "Visitors", group: "free-form", sample: "" },
  { token: "announcements", label: "Announcements", group: "free-form", sample: "" },
  { token: "wardBusiness", label: "Ward business", group: "free-form", sample: "" },
  { token: "stakeBusiness", label: "Stake business", group: "free-form", sample: "" },
] as const;

export const VARIABLE_BY_TOKEN: Map<string, ProgramVariable> = new Map(
  PROGRAM_VARIABLES.map((v) => [v.token, v]),
);

export const GROUP_LABEL: Record<ProgramVariable["group"], string> = {
  meeting: "Meeting",
  leadership: "Leadership",
  hymns: "Hymns",
  speakers: "Speakers",
  "free-form": "Free-form",
};
