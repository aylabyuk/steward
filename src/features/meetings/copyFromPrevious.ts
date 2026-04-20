import { collection, documentId, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sacramentMeetingSchema, type SacramentMeeting } from "@/lib/types";

export interface PreviousMeeting {
  date: string;
  data: SacramentMeeting;
}

const LOOKBACK_LIMIT = 10;

export async function findPreviousMeeting(
  wardId: string,
  beforeDate: string,
): Promise<PreviousMeeting | null> {
  const q = query(
    collection(db, "wards", wardId, "meetings"),
    where(documentId(), "<", beforeDate),
    orderBy(documentId(), "desc"),
    limit(LOOKBACK_LIMIT),
  );
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const parsed = sacramentMeetingSchema.safeParse(d.data());
    if (!parsed.success) continue;
    if (parsed.data.cancellation?.cancelled) continue;
    return { date: d.id, data: parsed.data };
  }
  return null;
}

export type CopyableField = "pianist" | "chorister" | "sacramentBread" | "sacramentBlessers";
export const COPYABLE_FIELDS: readonly CopyableField[] = [
  "pianist",
  "chorister",
  "sacramentBread",
  "sacramentBlessers",
];

export function copyableFields(prev: SacramentMeeting): Partial<SacramentMeeting> {
  const out: Partial<SacramentMeeting> = {};
  for (const field of COPYABLE_FIELDS) {
    const value = prev[field];
    if (value !== undefined) {
      Object.assign(out, { [field]: value });
    }
  }
  return out;
}

export function hasExistingValues(target: SacramentMeeting | null): boolean {
  if (!target) return false;
  return COPYABLE_FIELDS.some((f) => target[f] !== undefined);
}
