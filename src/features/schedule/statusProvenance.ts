import type { Speaker, WithId, Member } from "@/lib/types";
import type { SubState } from "@/hooks/_sub";

interface FirestoreTimestampLike {
  toDate: () => Date;
}

function resolveName(uid: string | undefined, members: SubState<WithId<Member>[]>): string | null {
  if (!uid) return null;
  const hit = members.data.find((m) => m.id === uid);
  return hit?.data.displayName ?? null;
}

function formatShortDate(value: unknown): string | null {
  if (!value) return null;
  const ts = value as Partial<FirestoreTimestampLike>;
  if (typeof ts.toDate === "function") {
    return ts.toDate().toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  if (value instanceof Date) {
    return value.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }
  return null;
}

/** Compact label describing who set the speaker's current status and
 *  how, for surfaces that want to show provenance next to the status
 *  badge. Returns null when the status is planned/invited (provenance
 *  is meaningful only for the terminal states) or when the speaker
 *  doc is missing the provenance fields (legacy rows pre-rollout). */
export function statusProvenanceLabel(
  speaker: Speaker,
  members: SubState<WithId<Member>[]>,
): string | null {
  if (speaker.status !== "confirmed" && speaker.status !== "declined") return null;
  if (!speaker.statusSource) return null;
  const who = resolveName(speaker.statusSetBy, members);
  const when = formatShortDate(speaker.statusSetAt);
  const source = speaker.statusSource === "speaker-response" ? "from reply" : "set manually";
  const byPart = who ? ` by ${who}` : "";
  const whenPart = when ? ` · ${when}` : "";
  const prefix =
    speaker.statusSource === "speaker-response"
      ? `${source} · applied${byPart}`
      : `${source}${byPart}`;
  return `${prefix}${whenPart}`;
}
