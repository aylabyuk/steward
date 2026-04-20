import { doc, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import type { WithId } from "@/hooks/_sub";
import { db } from "@/lib/firebase";
import { type Calling, callingToRole, type Member, memberSchema } from "@/lib/types";

export class LastBishopricError extends Error {
  override name = "LastBishopricError";
}

export function countActiveBishopric(members: readonly WithId<Member>[]): number {
  return members.filter((m) => m.data.active && m.data.role === "bishopric").length;
}

function wouldRemoveLastBishopric(
  members: readonly WithId<Member>[],
  targetUid: string,
  next: { active: boolean; role: Member["role"] },
): boolean {
  const target = members.find((m) => m.id === targetUid);
  if (!target) return false;
  const wasContributing = target.data.active && target.data.role === "bishopric";
  const willContribute = next.active && next.role === "bishopric";
  if (wasContributing && !willContribute) {
    return countActiveBishopric(members) === 1;
  }
  return false;
}

export interface AddMemberInput {
  wardId: string;
  uid: string;
  email: string;
  displayName: string;
  calling: Calling;
}

export async function addMember(input: AddMemberInput): Promise<void> {
  const role = callingToRole(input.calling);
  const data = memberSchema.parse({
    email: input.email,
    displayName: input.displayName,
    calling: input.calling,
    role,
    active: true,
    ccOnEmails: true,
    fcmTokens: [],
  });
  await setDoc(doc(db, "wards", input.wardId, "members", input.uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateCalling(
  wardId: string,
  members: readonly WithId<Member>[],
  uid: string,
  calling: Calling,
): Promise<void> {
  const role = callingToRole(calling);
  const target = members.find((m) => m.id === uid);
  const active = target?.data.active ?? true;
  if (wouldRemoveLastBishopric(members, uid, { active, role })) {
    throw new LastBishopricError("Cannot change calling — at least one active bishopric required.");
  }
  await updateDoc(doc(db, "wards", wardId, "members", uid), {
    calling,
    role,
    updatedAt: serverTimestamp(),
  });
}

export async function setActive(
  wardId: string,
  members: readonly WithId<Member>[],
  uid: string,
  active: boolean,
): Promise<void> {
  const target = members.find((m) => m.id === uid);
  const role = target?.data.role ?? "clerk";
  if (wouldRemoveLastBishopric(members, uid, { active, role })) {
    throw new LastBishopricError("Cannot deactivate the last active bishopric member.");
  }
  await updateDoc(doc(db, "wards", wardId, "members", uid), {
    active,
    updatedAt: serverTimestamp(),
  });
}

export async function setCcOnEmails(
  wardId: string,
  uid: string,
  ccOnEmails: boolean,
): Promise<void> {
  await updateDoc(doc(db, "wards", wardId, "members", uid), {
    ccOnEmails,
    updatedAt: serverTimestamp(),
  });
}
