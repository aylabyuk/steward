import type { WithId } from "@/hooks/_sub";
import type { Assignment, MeetingType, SacramentMeeting, Speaker } from "@/lib/types";
import type { RailSection } from "./ProgramRail";
import type { ReadinessReport } from "../readiness";

function hasPerson(a: Assignment | undefined): boolean {
  return Boolean(a?.person?.name);
}

export function buildRailSections(
  meeting: SacramentMeeting | null | undefined,
  speakers: readonly WithId<Speaker>[],
  type: MeetingType,
  report: ReadinessReport,
): RailSection[] {
  const m = meeting ?? undefined;
  const sections: RailSection[] = [
    { id: "sec-overview", label: "Approval", done: report.ready },
    {
      id: "sec-leaders",
      label: "Leaders",
      done: hasPerson(m?.presiding) && hasPerson(m?.conducting),
    },
    { id: "sec-notes", label: "Announcements", done: true },
    {
      id: "sec-prayers",
      label: "Prayers",
      done: hasPerson(m?.openingPrayer) && hasPerson(m?.benediction),
    },
    {
      id: "sec-music",
      label: "Music",
      done: hasPerson(m?.chorister) && hasPerson(m?.pianist),
    },
    {
      id: "sec-sacrament",
      label: "Sacrament",
      done:
        hasPerson(m?.sacramentBread) &&
        hasPerson(m?.sacramentBlessers?.[0]) &&
        hasPerson(m?.sacramentBlessers?.[1]),
    },
  ];
  if (type === "regular") {
    sections.push({
      id: "sec-speakers",
      label: "Speakers",
      count: speakers.length,
      done: speakers.length >= 2,
    });
  }
  sections.push({
    id: "sec-hymns",
    label: "Hymns & music",
    done: Boolean(m?.openingHymn && m?.sacramentHymn && m?.closingHymn),
  });
  return sections;
}
