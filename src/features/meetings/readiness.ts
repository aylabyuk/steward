import type { WithId } from "@/hooks/_sub";
import type { Assignment, MeetingType, SacramentMeeting, Speaker } from "@/lib/types";

function hasPerson(a: Assignment | undefined): boolean {
  return Boolean(a?.person?.name && a.person.name.length > 0);
}

const MIN_SPEAKERS = 2;

const REQUIRES_PROGRAM: ReadonlySet<MeetingType> = new Set(["regular"]);

const REQUIRES_SPEAKERS: ReadonlySet<MeetingType> = new Set(["regular"]);

/**
 * Returns the human-readable list of things still missing before a meeting
 * can reasonably be approved. Empty list = ready.
 *
 * Regular meetings require speakers + hymns + prayers + musicians.
 * Fast Sundays skip speakers. Stake/General conference meetings skip all checks.
 */
export function checkMeetingReadiness(
  meeting: SacramentMeeting | null,
  speakers: readonly WithId<Speaker>[],
  type: MeetingType,
): string[] {
  if (!meeting) return ["Meeting not created yet"];
  if (!REQUIRES_PROGRAM.has(type) && type !== "fast") return [];

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
