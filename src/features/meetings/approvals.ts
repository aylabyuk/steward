import { doc, runTransaction, serverTimestamp, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type Approval, sacramentMeetingSchema } from "@/lib/types";
import { appendHistoryEvent, currentActor, type HistoryActor } from "./history";

export { writeMeetingPatch } from "./writeMeetingPatch";

const REQUIRED_APPROVALS = 2;

/**
 * Explicitly return the meeting to draft. Used when the user wants to
 * edit a pending_approval or approved program: invalidates any live
 * approvals, resets requiredApprovals to the default, and sets status
 * back to "draft" so edits can proceed fresh.
 *
 * Runs inside a transaction so the approvals-array read + write is atomic
 * against concurrent writers (approve, request, or content edit).
 */
export async function resetToDraft(wardId: string, date: string): Promise<void> {
  const ref = doc(db, "wards", wardId, "meetings", date);
  const actor = currentActor();
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Meeting not found");
    const meeting = sacramentMeetingSchema.parse(snap.data());
    if (meeting.status === "draft") return;

    const approvals = meeting.approvals ?? [];
    const invalidatedAt = Timestamp.now();
    const updated = approvals.map((a) =>
      a.invalidated ? a : { ...a, invalidated: true, invalidatedAt },
    );
    const priorStatus = meeting.status;

    tx.update(ref, {
      status: "draft",
      approvals: updated,
      requiredApprovals: REQUIRED_APPROVALS,
      updatedAt: serverTimestamp(),
    });
    if (actor) {
      appendHistoryEvent(tx, wardId, date, actor, {
        target: "meeting",
        targetId: date,
        action: "update",
        changes: [{ field: "status", old: priorStatus, new: "draft" }],
      });
    }
  });
}

export interface SelfApprover {
  uid: string;
  email: string;
  displayName: string;
  isBishopric: boolean;
}

/**
 * Flip meeting.status → pending_approval. If the requester is a
 * bishopric member, their request *also* counts as one of the two
 * required approvals; another bishopric member still has to approve
 * before the meeting is considered approved. Clerks and secretaries
 * have to collect two separate bishopric approvals.
 *
 * Transactional so a concurrent approve() can't drop the self-approval.
 */
export async function requestApproval(
  wardId: string,
  date: string,
  selfApprover?: SelfApprover,
): Promise<void> {
  const ref = doc(db, "wards", wardId, "meetings", date);
  const actor = currentActor();
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Meeting not found");
    const meeting = sacramentMeetingSchema.parse(snap.data());
    const approvals = meeting.approvals ?? [];

    const update: Record<string, unknown> = {
      requiredApprovals: REQUIRED_APPROVALS,
      updatedAt: serverTimestamp(),
    };

    let liveAfter = approvals.filter((a) => !a.invalidated).length;

    if (selfApprover?.isBishopric) {
      const alreadyApproved = approvals.some((a) => a.uid === selfApprover.uid && !a.invalidated);
      if (!alreadyApproved) {
        const selfApproval: Approval = {
          uid: selfApprover.uid,
          email: selfApprover.email,
          displayName: selfApprover.displayName,
          approvedAt: Timestamp.now(),
          approvedVersionHash: meeting.contentVersionHash ?? "",
          invalidated: false,
        };
        update.approvals = [...approvals, selfApproval];
        liveAfter += 1;
      }
    }

    const newStatus = liveAfter >= REQUIRED_APPROVALS ? "approved" : "pending_approval";
    update.status = newStatus;

    tx.update(ref, update);
    if (actor) {
      appendHistoryEvent(tx, wardId, date, actor, {
        target: "meeting",
        targetId: date,
        action: "update",
        changes: [{ field: "status", old: meeting.status, new: newStatus }],
      });
    }
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

/**
 * Append one bishopric approval. Transactional so two concurrent
 * approvers each read+write the same doc atomically instead of
 * overwriting each other's append.
 */
export async function approveMeeting(input: ApproveInput): Promise<void> {
  const ref = doc(db, "wards", input.wardId, "meetings", input.date);
  const actor: HistoryActor = { uid: input.uid, displayName: input.displayName };
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Meeting not found");
    const meeting = sacramentMeetingSchema.parse(snap.data());
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
    const requiredApprovals = meeting.requiredApprovals ?? REQUIRED_APPROVALS;
    const newStatus = live.length >= requiredApprovals ? "approved" : "pending_approval";

    tx.update(ref, {
      approvals: updated,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });
    appendHistoryEvent(tx, input.wardId, input.date, actor, {
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
  });
}
