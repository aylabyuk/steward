import {
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  type Calling,
  callingToRole,
  inviteSchema,
  memberSchema,
} from "@/lib/types";

function inviteEmailKey(email: string): string {
  return email.trim().toLowerCase();
}

export interface SendInviteInput {
  wardId: string;
  wardName: string;
  email: string;
  displayName: string;
  calling: Calling;
  invitedBy: string;
  invitedByName: string;
}

export async function sendInvite(input: SendInviteInput): Promise<void> {
  const emailKey = inviteEmailKey(input.email);
  const data = inviteSchema.parse({
    email: emailKey,
    displayName: input.displayName.trim(),
    calling: input.calling,
    role: callingToRole(input.calling),
    wardName: input.wardName,
    invitedBy: input.invitedBy,
    invitedByName: input.invitedByName,
    invitedAt: null,
  });
  await setDoc(doc(db, "wards", input.wardId, "invites", emailKey), {
    ...data,
    invitedAt: serverTimestamp(),
  });
}

export async function revokeInvite(wardId: string, email: string): Promise<void> {
  await deleteDoc(doc(db, "wards", wardId, "invites", inviteEmailKey(email)));
}

/**
 * Complete an invite: create the caller's member doc from the invite
 * contents, then delete the invite. The rule enforces that the new doc's
 * role/calling/email/displayName mirror the invite so the invitee can't
 * escalate their own calling.
 */
export async function acceptInvite(
  wardId: string,
  uid: string,
  email: string,
): Promise<void> {
  const emailKey = inviteEmailKey(email);
  const inviteRef = doc(db, "wards", wardId, "invites", emailKey);
  const snap = await getDoc(inviteRef);
  if (!snap.exists()) throw new Error("Invite not found");
  const invite = inviteSchema.parse(snap.data());

  const data = memberSchema.parse({
    email: emailKey,
    displayName: invite.displayName,
    calling: invite.calling,
    role: invite.role,
    active: true,
    ccOnEmails: true,
    fcmTokens: [],
  });
  await setDoc(doc(db, "wards", wardId, "members", uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  await deleteDoc(inviteRef);
}

/**
 * Cross-ward lookup: is there an invite anywhere matching this email?
 * Used on the access-required landing so a freshly-signed-in user can
 * see their pending invite without the bishop having to share a link.
 */
export interface PendingInvite {
  wardId: string;
  wardName: string;
  inviteId: string;
  displayName: string;
  calling: Calling;
  invitedByName: string;
}

export async function findInvitesForEmail(email: string): Promise<PendingInvite[]> {
  const emailKey = inviteEmailKey(email);
  const snap = await getDocs(
    query(collectionGroup(db, "invites"), where("email", "==", emailKey)),
  );
  const out: PendingInvite[] = [];
  for (const d of snap.docs) {
    const wardId = d.ref.parent.parent?.id;
    if (!wardId) continue;
    const parsed = inviteSchema.safeParse(d.data());
    if (!parsed.success) continue;
    out.push({
      wardId,
      wardName: parsed.data.wardName || wardId,
      inviteId: d.id,
      displayName: parsed.data.displayName,
      calling: parsed.data.calling,
      invitedByName: parsed.data.invitedByName,
    });
  }
  return out;
}
