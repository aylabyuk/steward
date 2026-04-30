import type { SpeakerInvitation } from "@/lib/types";

export type SlotKind = NonNullable<SpeakerInvitation["kind"]>;

/** Bishop-facing noun for the assignee. Threaded into chat copy so a
 *  prayer-giver's chat doesn't read as if they signed up to speak. */
export function assigneeNoun(kind: SlotKind | undefined): string {
  return kind === "prayer" ? "Prayer giver" : "Speaker";
}

/** Lowercase variant for mid-sentence use ("Prayer giver last seen"). */
export function assigneeNounLower(kind: SlotKind | undefined): string {
  return kind === "prayer" ? "prayer giver" : "speaker";
}

/** Verb the assignee committed to, for confirmation copy
 *  ("thank you for offering the prayer / speaking on Sun May 20"). */
export function assigneeAction(kind: SlotKind | undefined): string {
  return kind === "prayer" ? "offering the prayer" : "speaking";
}
