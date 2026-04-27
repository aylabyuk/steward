import { collection, doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { appendHistoryEvent, currentActor } from "@/features/meetings/history";
import { db } from "@/lib/firebase";

function commentRef(wardId: string, date: string, commentId: string) {
  return doc(db, "wards", wardId, "meetings", date, "comments", commentId);
}

function commentsRef(wardId: string, date: string) {
  return collection(db, "wards", wardId, "meetings", date, "comments");
}

export interface CreateCommentInput {
  wardId: string;
  date: string;
  authorUid: string;
  authorDisplayName: string;
  body: string;
  mentionedUids: string[];
}

// Comment bodies are not diffed in history (the comment doc's editedAt /
// deletedAt covers the lifecycle, and bodies could be long). Only the
// create/update/delete event itself is recorded.

export async function createComment(input: CreateCommentInput): Promise<void> {
  const ref = doc(commentsRef(input.wardId, input.date));
  const batch = writeBatch(db);
  batch.set(ref, {
    authorUid: input.authorUid,
    authorDisplayName: input.authorDisplayName,
    body: input.body,
    mentionedUids: input.mentionedUids,
    createdAt: serverTimestamp(),
  });
  appendHistoryEvent(
    batch,
    input.wardId,
    input.date,
    { uid: input.authorUid, displayName: input.authorDisplayName },
    { target: "comment", targetId: ref.id, action: "create" },
  );
  await batch.commit();
}

export async function editComment(
  wardId: string,
  date: string,
  commentId: string,
  body: string,
  mentionedUids: string[],
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(commentRef(wardId, date, commentId), {
    body,
    mentionedUids,
    editedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "comment",
      targetId: commentId,
      action: "update",
    });
  }
  await batch.commit();
}

export async function softDeleteComment(
  wardId: string,
  date: string,
  commentId: string,
): Promise<void> {
  const batch = writeBatch(db);
  batch.update(commentRef(wardId, date, commentId), {
    deletedAt: serverTimestamp(),
  });
  const actor = currentActor();
  if (actor) {
    appendHistoryEvent(batch, wardId, date, actor, {
      target: "comment",
      targetId: commentId,
      action: "delete",
    });
  }
  await batch.commit();
}
