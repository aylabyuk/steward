import type { WithId } from "@/hooks/_sub";
import type { Assignment, MeetingType, SacramentMeeting, Speaker } from "@/lib/types";

function hasPerson(a: Assignment | undefined): boolean {
  return Boolean(a?.person?.name && a.person.name.length > 0);
}

function isConfirmed(a: Assignment | undefined): boolean {
  return Boolean(a?.confirmed);
}

const MIN_SPEAKERS = 2;

const REQUIRES_PROGRAM: ReadonlySet<MeetingType> = new Set(["regular"]);
const REQUIRES_SPEAKERS: ReadonlySet<MeetingType> = new Set(["regular"]);

export interface ReadinessReport {
  missing: string[];
  unconfirmed: string[];
  totalItems: number;
  doneCount: number;
  ready: boolean;
}

/**
 * Returns a full readiness breakdown so the Program page can surface both
 * "still needed" items (no one assigned / no hymn) and "unconfirmed" ones
 * (assigned but not yet marked confirmed).
 */
export function checkMeetingReadiness(
  meeting: SacramentMeeting | null,
  speakers: readonly WithId<Speaker>[],
  type: MeetingType,
): ReadinessReport {
  if (!meeting) {
    return {
      missing: ["Meeting not created yet"],
      unconfirmed: [],
      totalItems: 1,
      doneCount: 0,
      ready: false,
    };
  }
  if (!REQUIRES_PROGRAM.has(type) && type !== "fast") {
    return { missing: [], unconfirmed: [], totalItems: 0, doneCount: 0, ready: true };
  }

  const missing: string[] = [];
  const unconfirmed: string[] = [];

  const personRows: Array<[string, Assignment | undefined]> = [
    ["Presiding", meeting.presiding],
    ["Conducting", meeting.conducting],
    ["Opening Prayer", meeting.openingPrayer],
    ["Closing Prayer", meeting.benediction],
    ["Chorister", meeting.chorister],
    ["Pianist", meeting.pianist],
    ["Sacrament bread", meeting.sacramentBread],
  ];
  const blessers = meeting.sacramentBlessers ?? [];
  personRows.push(["Blesser 1", blessers[0]]);
  personRows.push(["Blesser 2", blessers[1]]);

  for (const [label, a] of personRows) {
    if (!hasPerson(a)) missing.push(`${label} — not assigned`);
    else if (!isConfirmed(a)) unconfirmed.push(`${label} — not confirmed`);
  }

  if (REQUIRES_SPEAKERS.has(type)) {
    if (speakers.length < MIN_SPEAKERS) {
      missing.unshift(`${MIN_SPEAKERS - speakers.length} more speaker(s) needed`);
    }
    for (const s of speakers) {
      if (s.data.status !== "confirmed") {
        unconfirmed.push(`${s.data.name} — not confirmed`);
      }
    }
  }
  if (!meeting.openingHymn) missing.push("Opening hymn");
  if (!meeting.sacramentHymn) missing.push("Sacrament hymn");
  if (!meeting.closingHymn) missing.push("Closing hymn");

  if (meeting.mid?.mode === "rest" && !meeting.mid.rest) missing.push("Rest hymn");
  if (meeting.mid?.mode === "musical" && !meeting.mid.musical?.performer) {
    missing.push("Musical number performer");
  }

  const speakerItems = REQUIRES_SPEAKERS.has(type) ? Math.max(MIN_SPEAKERS, speakers.length) : 0;
  const totalItems =
    personRows.length +
    3 /*hymns*/ +
    (meeting.mid && meeting.mid.mode !== "none" ? 1 : 0) +
    speakerItems;
  const doneCount = Math.max(0, totalItems - missing.length - unconfirmed.length);
  const ready = missing.length === 0 && unconfirmed.length === 0;

  return { missing, unconfirmed, totalItems, doneCount, ready };
}

/**
 * Back-compat wrapper: returns only the missing list (old shape).
 */
export function checkMissingItems(
  meeting: SacramentMeeting | null,
  speakers: readonly WithId<Speaker>[],
  type: MeetingType,
): string[] {
  return checkMeetingReadiness(meeting, speakers, type).missing;
}
