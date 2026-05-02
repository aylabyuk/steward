import {
  FieldValue,
  type DocumentReference,
  type Firestore,
  type Transaction,
  type WriteBatch,
} from "firebase-admin/firestore";
import type {
  SpeakerInvitationAuthShape,
  SpeakerInvitationPublicShape,
  SpeakerInvitationShape,
} from "./invitationTypes.js";

/** Stable subcollection-doc id for the private auth subdoc.
 *  Mirrors `SPEAKER_INVITATION_AUTH_DOC` in
 *  `src/lib/types/speakerInvitationAuth.ts`. */
export const AUTH_DOC_ID = "auth" as const;

/** Path of the public parent doc. */
export function publicInvitationPath(wardId: string, invitationId: string): string {
  return `wards/${wardId}/speakerInvitations/${invitationId}`;
}

/** Path of the private auth subdoc. */
export function authInvitationPath(wardId: string, invitationId: string): string {
  return `${publicInvitationPath(wardId, invitationId)}/private/${AUTH_DOC_ID}`;
}

export function authDocRef(parentRef: DocumentReference): DocumentReference {
  return parentRef.collection("private").doc(AUTH_DOC_ID);
}

/** Create the parent + auth subdoc atomically as a batched write.
 *  Allocates the parent doc id from the wards collection so callers
 *  can use it for downstream writes that need to reference the
 *  invitation immediately (e.g. stamping `participant.invitationId`). */
export async function createSplitInvitationDocs(
  db: Firestore,
  wardId: string,
  parentData: SpeakerInvitationPublicShape & {
    /** Server-stamped at create time. */
    createdAt: FieldValue;
  },
  authData: SpeakerInvitationAuthShape,
): Promise<{ invitationId: string; parentRef: DocumentReference }> {
  const parentRef = db.collection(`wards/${wardId}/speakerInvitations`).doc();
  const subRef = authDocRef(parentRef);
  const batch = db.batch();
  batch.set(parentRef, parentData);
  batch.set(subRef, authData);
  await batch.commit();
  return { invitationId: parentRef.id, parentRef };
}

/** Load both halves of a split invitation and return the merged view.
 *  Tolerates the migration window: if the auth subdoc is missing,
 *  reads pre-migration fields off the parent so older invitations
 *  still work until the migration script runs. Returns null when the
 *  parent doc itself doesn't exist. */
export async function loadMergedInvitation(
  db: Firestore,
  wardId: string,
  invitationId: string,
): Promise<SpeakerInvitationShape | null> {
  const parentRef = db.doc(publicInvitationPath(wardId, invitationId));
  const [parentSnap, authSnap] = await Promise.all([
    parentRef.get(),
    authDocRef(parentRef).get(),
  ]);
  if (!parentSnap.exists) return null;
  const parent = parentSnap.data() as SpeakerInvitationShape;
  const auth = (authSnap.exists ? (authSnap.data() as SpeakerInvitationAuthShape) : {}) as
    | SpeakerInvitationAuthShape
    | Record<string, never>;
  return { ...parent, ...auth };
}

/** Same as `loadMergedInvitation` but resolves by the conversation SID
 *  Twilio reports on its inbound webhook. Returns the wardId + id
 *  alongside so callers can do follow-up writes. */
export async function loadMergedInvitationByConversation(
  db: Firestore,
  conversationSid: string,
): Promise<
  | (SpeakerInvitationShape & { wardId: string; invitationId: string })
  | null
> {
  const q = await db
    .collectionGroup("speakerInvitations")
    .where("conversationSid", "==", conversationSid)
    .limit(1)
    .get();
  if (q.empty) return null;
  const parentSnap = q.docs[0]!;
  const wardId = parentSnap.ref.path.split("/")[1]!;
  const invitationId = parentSnap.id;
  const authSnap = await authDocRef(parentSnap.ref).get();
  const parent = parentSnap.data() as SpeakerInvitationShape;
  const auth = (authSnap.exists ? (authSnap.data() as SpeakerInvitationAuthShape) : {}) as
    | SpeakerInvitationAuthShape
    | Record<string, never>;
  return { ...parent, ...auth, wardId, invitationId };
}

/** Stage a write to the auth subdoc on a `WriteBatch`. */
export function batchUpdateAuth(
  db: Firestore,
  batch: WriteBatch,
  wardId: string,
  invitationId: string,
  data: Partial<SpeakerInvitationAuthShape>,
): void {
  batch.update(db.doc(authInvitationPath(wardId, invitationId)), data);
}

/** Stage a write to the parent (public) doc on a `WriteBatch`. */
export function batchUpdatePublic(
  db: Firestore,
  batch: WriteBatch,
  wardId: string,
  invitationId: string,
  data: Partial<SpeakerInvitationPublicShape>,
): void {
  batch.update(db.doc(publicInvitationPath(wardId, invitationId)), data);
}

/** Update the auth subdoc directly (no batch). */
export async function updateAuth(
  db: Firestore,
  wardId: string,
  invitationId: string,
  data: Partial<SpeakerInvitationAuthShape>,
): Promise<void> {
  await db.doc(authInvitationPath(wardId, invitationId)).update(data);
}

/** Within a transaction, read the parent and auth halves and return
 *  the merged shape. Use the returned `parentRef`/`authRef` to write
 *  back through the transaction. */
export async function txGetMerged(
  db: Firestore,
  tx: Transaction,
  wardId: string,
  invitationId: string,
): Promise<{
  parentRef: DocumentReference;
  authRef: DocumentReference;
  data: SpeakerInvitationShape | null;
}> {
  const parentRef = db.doc(publicInvitationPath(wardId, invitationId));
  const authRef = authDocRef(parentRef);
  const [parentSnap, authSnap] = await Promise.all([tx.get(parentRef), tx.get(authRef)]);
  if (!parentSnap.exists) return { parentRef, authRef, data: null };
  const parent = parentSnap.data() as SpeakerInvitationShape;
  const auth = (authSnap.exists ? (authSnap.data() as SpeakerInvitationAuthShape) : {}) as
    | SpeakerInvitationAuthShape
    | Record<string, never>;
  return { parentRef, authRef, data: { ...parent, ...auth } };
}
