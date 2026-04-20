import type { WithId } from "@/hooks/_sub";
import type { Assignment, MeetingType, SacramentMeeting, Speaker } from "@/lib/types";

function hasPerson(a: Assignment | undefined): boolean {
  return Boolean(a?.person?.name && a.person.name.length > 0);
}

const MIN_SPEAKERS = 2;

const REQUIRES_PROGRAM: ReadonlySet<MeetingType> = new Set(["regular", "ward_conference"]);

const REQUIRES_SPEAKERS: ReadonlySet<MeetingType> = new Set(["regular", "ward_conference"]);

/**
 * Returns the human-readable list of things still missing before a meeting
 * can reasonably be approved. Empty list = ready.
 *
 * Only meaningfully-gated types (regular, ward_conference) are checked;
 * fast_sunday skips the speakers requirement; stake/general_conference +
 * other are assumed free-form (empty list).
 */
export function checkMeetingReadiness(
  meeting: SacramentMeeting | null,
  speakers: readonly WithId<Speaker>[],
  type: MeetingType,
): string[] {
  if (!meeting) return ["Meeting not created yet"];
  if (!REQUIRES_PROGRAM.has(type) && type !== "fast_sunday") return [];

  const missing: string[] = [];

  if (REQUIRES_SPEAKERS.has(type) && speakers.length < MIN_SPEAKERS) {
    missing.push(`${MIN_SPEAKERS - speakers.length} more speaker(s) needed`);
  }

  if (!meeting.openingHymn) missing.push("Opening hymn");
  if (!meeting.sacramentHymn) missing.push("Sacrament hymn");
  if (!meeting.closingHymn) missing.push("Closing hymn");
  if (!hasPerson(meeting.openingPrayer)) missing.push("Opening prayer");
  if (!hasPerson(meeting.benediction)) missing.push("Benediction");
  if (!hasPerson(meeting.pianist)) missing.push("Pianist");
  if (!hasPerson(meeting.chorister)) missing.push("Chorister");
  if (!hasPerson(meeting.sacramentBread)) missing.push("Sacrament bread");

  const blessers = meeting.sacramentBlessers ?? [];
  const blesserCount = blessers.filter(hasPerson).length;
  if (blesserCount < 2) missing.push(`${2 - blesserCount} sacrament blesser(s)`);

  return missing;
}
