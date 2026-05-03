import {
  collection,
  doc,
  serverTimestamp,
  type Transaction,
  type WriteBatch,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { HistoryChange } from "@/lib/types";

/** A Firestore writer — either a batched write or an active transaction. */
export type HistoryWriter = WriteBatch | Transaction;

export interface HistoryActor {
  uid: string;
  displayName: string;
}

export function currentActor(): HistoryActor | null {
  const user = auth.currentUser;
  if (!user) return null;
  return {
    uid: user.uid,
    displayName: user.displayName ?? user.email ?? "Unknown",
  };
}

export type HistoryTarget = "meeting" | "speaker" | "comment";
export type HistoryAction = "create" | "update" | "delete";

export interface HistoryEventInput {
  target: HistoryTarget;
  targetId: string;
  action: HistoryAction;
  changes?: HistoryChange[];
}

const NOISE_FIELDS = new Set(["updatedAt", "createdAt", "contentVersionHash", "letterUpdatedAt"]);

function canonical(value: unknown): string {
  return JSON.stringify(value, (_, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const sorted: Record<string, unknown> = {};
      for (const k of Object.keys(v as object).toSorted()) {
        sorted[k] = (v as Record<string, unknown>)[k];
      }
      return sorted;
    }
    return v;
  });
}

export interface DiffOptions {
  include?: readonly string[];
  exclude?: readonly string[];
}

export function computeDiff(
  oldData: Record<string, unknown> | null | undefined,
  newData: Record<string, unknown>,
  options: DiffOptions = {},
): HistoryChange[] {
  const oldObj = oldData ?? {};
  const exclude = new Set([...NOISE_FIELDS, ...(options.exclude ?? [])]);
  const fields = new Set<string>();
  if (options.include) {
    for (const f of options.include) fields.add(f);
  } else {
    for (const k of Object.keys(oldObj)) fields.add(k);
    for (const k of Object.keys(newData)) fields.add(k);
  }
  const out: HistoryChange[] = [];
  for (const field of fields) {
    if (exclude.has(field)) continue;
    const oldVal = (oldObj as Record<string, unknown>)[field];
    const newVal = newData[field];
    if (canonical(oldVal) === canonical(newVal)) continue;
    const change: HistoryChange = { field };
    if (oldVal !== undefined) change.old = oldVal;
    if (newVal !== undefined) change.new = newVal;
    out.push(change);
  }
  return out;
}

export function appendHistoryEvent(
  writer: HistoryWriter,
  wardId: string,
  date: string,
  actor: HistoryActor,
  event: HistoryEventInput,
): void {
  const ref = doc(collection(db, "wards", wardId, "meetings", date, "history"));
  // Both WriteBatch and Transaction expose .set(ref, data); TS can't reconcile
  // the union's return types so we narrow to WriteBatch — the call shape matches.
  (writer as WriteBatch).set(ref, {
    actorUid: actor.uid,
    actorDisplayName: actor.displayName,
    at: serverTimestamp(),
    target: event.target,
    targetId: event.targetId,
    action: event.action,
    changes: event.changes ?? [],
  });
}
