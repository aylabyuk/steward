import type { WithId } from "@/hooks/_sub";
import type { Assignment, MeetingType, SacramentMeeting, Speaker } from "@/lib/types";
import type { RailSection, RailState } from "./ProgramRail";
import type { ReadinessReport } from "../utils/readiness";

function hasPerson(a: Assignment | undefined): boolean {
  return Boolean(a?.person?.name);
}

function isConfirmed(a: Assignment | undefined): boolean {
  return Boolean(a?.confirmed);
}

/**
 * Reduce a set of assignments to a rail state:
 * - `missing`     → any slot lacks a person
 * - `unconfirmed` → everyone assigned but at least one isn't confirmed
 * - `done`        → everyone assigned and confirmed
 */
function peopleState(assignments: readonly (Assignment | undefined)[]): RailState {
  if (assignments.some((a) => !hasPerson(a))) return "missing";
  if (assignments.some((a) => !isConfirmed(a))) return "unconfirmed";
  return "done";
}

export function buildRailSections(
  meeting: SacramentMeeting | null | undefined,
  speakers: readonly WithId<Speaker>[],
  type: MeetingType,
  report: ReadinessReport,
): RailSection[] {
  const m = meeting ?? undefined;
  const sections: RailSection[] = [
    { id: "sec-overview", label: "Print readiness", state: report.ready ? "done" : "missing" },
    {
      id: "sec-leaders",
      label: "Leaders",
      state: peopleState([m?.presiding, m?.conducting]),
    },
    { id: "sec-notes", label: "Announcements", state: "done" },
    {
      id: "sec-prayers",
      label: "Prayers",
      state: peopleState([m?.openingPrayer, m?.benediction]),
    },
    {
      id: "sec-sacrament",
      label: "Sacrament",
      state: peopleState([m?.sacramentBread, m?.sacramentBlessers?.[0], m?.sacramentBlessers?.[1]]),
    },
  ];
  if (type === "regular") {
    let speakerState: RailState = "missing";
    if (speakers.length >= 2) {
      speakerState = speakers.every((s) => s.data.status === "confirmed") ? "done" : "unconfirmed";
    }
    sections.push({
      id: "sec-speakers",
      label: "Speakers",
      count: speakers.length,
      state: speakerState,
    });
  }
  const hymnsMissing = !(m?.openingHymn && m?.sacramentHymn && m?.closingHymn);
  sections.push({
    id: "sec-music",
    label: "Music & hymns",
    state: hymnsMissing ? "missing" : peopleState([m?.chorister, m?.pianist]),
  });
  return sections;
}
