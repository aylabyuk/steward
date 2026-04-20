import type { WithId } from "@/hooks/_sub";
import type { Assignment, Hymn, SacramentMeeting, Speaker, SpecialNumber } from "@/lib/types";

function hymnKey(h: Hymn | null | undefined): string {
  if (!h) return "∅";
  return `${h.number}:${h.title}`;
}

function assignKey(a: Assignment | null | undefined): string {
  if (!a) return "∅";
  const name = a.person?.name ?? "";
  const email = a.person?.email ?? "";
  return `${name}|${email}|${a.status}`;
}

function specialKey(s: SpecialNumber | null | undefined): string {
  if (!s) return "∅";
  return `${s.performer}|${s.piece ?? ""}|${s.status}`;
}

function speakerKey(s: Speaker): string {
  return [s.name, s.email ?? "", s.topic ?? "", s.status, s.letterBody ?? ""].join("|");
}

/**
 * Canonical string for the approvable content of a meeting + speakers.
 * Excludes cancellation, approvals, updatedAt/createdAt/lastNudgedAt, and
 * contentVersionHash itself -- per docs/domain.md, cancellation is orthogonal
 * to approval and timestamps are write-time metadata.
 */
export function canonicalizeContent(
  m: SacramentMeeting,
  speakers: readonly WithId<Speaker>[],
): string {
  const blessers = (m.sacramentBlessers ?? []).map(assignKey).join(",");
  const sortedSpeakers = [...speakers].toSorted((a, b) => a.id.localeCompare(b.id));
  const parts = [
    `type:${m.meetingType}`,
    `openingHymn:${hymnKey(m.openingHymn)}`,
    `sacramentHymn:${hymnKey(m.sacramentHymn)}`,
    `closingHymn:${hymnKey(m.closingHymn)}`,
    `openingPrayer:${assignKey(m.openingPrayer)}`,
    `benediction:${assignKey(m.benediction)}`,
    `pianist:${assignKey(m.pianist)}`,
    `chorister:${assignKey(m.chorister)}`,
    `presiding:${assignKey(m.presiding)}`,
    `conducting:${assignKey(m.conducting)}`,
    `bread:${assignKey(m.sacramentBread)}`,
    `blessers:${blessers}`,
    `specialNumber:${specialKey(m.specialNumber)}`,
    `wardBusiness:${m.wardBusiness ?? ""}`,
    `stakeBusiness:${m.stakeBusiness ?? ""}`,
    `announcements:${m.announcements ?? ""}`,
    `speakers:${sortedSpeakers.map((s) => `${s.id}=${speakerKey(s.data)}`).join(";")}`,
  ];
  return parts.join("\n");
}

function bytesToHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) out += b.toString(16).padStart(2, "0");
  return out;
}

export async function computeContentHash(
  m: SacramentMeeting,
  speakers: readonly WithId<Speaker>[],
): Promise<string> {
  const canonical = canonicalizeContent(m, speakers);
  const buf = new TextEncoder().encode(canonical);
  const digest = await crypto.subtle.digest("SHA-256", buf);
  return bytesToHex(new Uint8Array(digest)).slice(0, 16);
}
