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
 *  badge. Returns null only when the speaker doc is missing the
 *  provenance fields (legacy rows pre-rollout) — every live status
 *  (planned / invited / confirmed / declined) gets a label so the
 *  banner's height stays stable across transitions. */
export function statusProvenanceLabel(
  speaker: Speaker,
  members: SubState<WithId<Member>[]>,
): string | null {
  if (!speaker.statusSource) return null;
  const who = resolveName(speaker.statusSetBy, members);
  const when = formatShortDate(speaker.statusSetAt);
  const verb = statusVerb(speaker.status ?? "planned", speaker.statusSource);
  const byPart = who ? ` by ${who}` : "";
  const whenPart = when ? ` · ${when}` : "";
  const prefix =
    speaker.statusSource === "speaker-response" ? `${verb} · applied${byPart}` : `${verb}${byPart}`;
  return `${prefix}${whenPart}`;
}

function statusVerb(
  status: NonNullable<Speaker["status"]>,
  source: NonNullable<Speaker["statusSource"]>,
): string {
  if (source === "speaker-response") return "from reply";
  switch (status) {
    case "planned":
      return "planned";
    case "invited":
      return "invited";
    case "confirmed":
      return "set manually";
    case "declined":
      return "set manually";
  }
}
