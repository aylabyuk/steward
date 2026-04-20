import { doc, serverTimestamp, Timestamp, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Approval } from "@/lib/types";
import { appendHistoryEvent, currentActor, type HistoryActor } from "./history";
import { readMeetingAndSpeakers } from "./readMeetingAndSpeakers";

export { writeMeetingPatch } from "./writeMeetingPatch";

const REQUIRED_APPROVALS = 2;

export async function requestApproval(wardId: string, date: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(doc(db, "wards", wardId, "meetings", date), {
    status: "pending_approval",
    updatedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "meeting",
      targetId: date,
      action: "update",
      changes: [{ field: "status", old: "draft", new: "pending_approval" }],
    });
  }
  await batch.commit();
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

  const batch = writeBatch(db);
  batch.update(doc(db, "wards", input.wardId, "meetings", input.date), {
    approvals: updated,
    status: newStatus,
    updatedAt: serverTimestamp(),
  });
  const actor: HistoryActor = { uid: input.uid, displayName: input.displayName };
  appendHistoryEvent(batch, input.wardId, input.date, actor, {
    target: "approval",
    targetId: input.uid,
    action: "create",
    changes: [
      { field: "live", new: live.length },
      ...(meeting.status !== newStatus
        ? [{ field: "status", old: meeting.status, new: newStatus }]
        : []),
    ],
  });
  await batch.commit();
}
