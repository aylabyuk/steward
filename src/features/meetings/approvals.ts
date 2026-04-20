import {
  collection,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import type { WithId } from "@/hooks/_sub";
import { db } from "@/lib/firebase";
import {
  type Approval,
  sacramentMeetingSchema,
  type SacramentMeeting,
  speakerSchema,
  type Speaker,
} from "@/lib/types";
import { computeContentHash } from "./contentHash";

const REQUIRED_APPROVALS = 2;

async function readMeetingAndSpeakers(
  wardId: string,
  date: string,
): Promise<{ meeting: SacramentMeeting; speakers: WithId<Speaker>[] } | null> {
  const mSnap = await getDoc(doc(db, "wards", wardId, "meetings", date));
  if (!mSnap.exists()) return null;
  const mParsed = sacramentMeetingSchema.safeParse(mSnap.data());
  if (!mParsed.success) return null;

  const sSnap = await getDocs(collection(db, "wards", wardId, "meetings", date, "speakers"));
  const speakers: WithId<Speaker>[] = [];
  for (const d of sSnap.docs) {
    const parsed = speakerSchema.safeParse(d.data());
    if (parsed.success) speakers.push({ id: d.id, data: parsed.data });
  }
  return { meeting: mParsed.data, speakers };
}

/**
 * Applies `patch` to the meeting doc, recomputes contentVersionHash from the
 * (post-patch) content + current speakers, and -- if the hash changed and the
 * meeting has live approvals -- marks those approvals invalidated and flips
 * status back to draft (per the "everything is always editable" invariant).
 */
export async function writeMeetingPatch(
  wardId: string,
  date: string,
  patch: Partial<SacramentMeeting>,
): Promise<void> {
  const current = await readMeetingAndSpeakers(wardId, date);
  if (!current) return;
  const { meeting, speakers } = current;
  const newMeeting = { ...meeting, ...patch };
  const newHash = await computeContentHash(newMeeting, speakers);

  const hashChanged = newHash !== meeting.contentVersionHash;
  const approvals = meeting.approvals ?? [];
  const hadLiveApprovals = approvals.some((a) => !a.invalidated);

  const full: Record<string, unknown> = {
    ...patch,
    contentVersionHash: newHash,
    updatedAt: serverTimestamp(),
  };

  if (hashChanged && hadLiveApprovals) {
    const invalidatedAt = Timestamp.now();
    full.approvals = approvals.map((a) =>
      a.invalidated ? a : { ...a, invalidated: true, invalidatedAt },
    );
    if (meeting.status !== "draft") full.status = "draft";
  }

  await updateDoc(doc(db, "wards", wardId, "meetings", date), full);
}

export async function requestApproval(wardId: string, date: string): Promise<void> {
  await updateDoc(doc(db, "wards", wardId, "meetings", date), {
    status: "pending_approval",
    updatedAt: serverTimestamp(),
  });
}

export interface ApproveInput {
  wardId: string;
  date: string;
  uid: string;
  email: string;
  displayName: string;
}

export class AlreadyApprovedError extends Error {
  override name = "AlreadyApprovedError";
}

export async function approveMeeting(input: ApproveInput): Promise<void> {
  const current = await readMeetingAndSpeakers(input.wardId, input.date);
  if (!current) throw new Error("Meeting not found");
  const { meeting } = current;
  const approvals = meeting.approvals ?? [];

  if (approvals.some((a) => a.uid === input.uid && !a.invalidated)) {
    throw new AlreadyApprovedError("You have already approved this meeting.");
  }

  const newApproval: Approval = {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName,
    approvedAt: Timestamp.now(),
    approvedVersionHash: meeting.contentVersionHash ?? "",
    invalidated: false,
  };

  const updated = [...approvals, newApproval];
  const live = updated.filter((a) => !a.invalidated);
  const newStatus = live.length >= REQUIRED_APPROVALS ? "approved" : "pending_approval";

  await updateDoc(doc(db, "wards", input.wardId, "meetings", input.date), {
    approvals: updated,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
}
