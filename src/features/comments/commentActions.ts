import { addDoc, collection, doc, serverTimestamp, updateDoc } from "firebase/firestore";
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

export async function createComment(input: CreateCommentInput): Promise<void> {
  await addDoc(commentsRef(input.wardId, input.date), {
    authorUid: input.authorUid,
    authorDisplayName: input.authorDisplayName,
    body: input.body,
    mentionedUids: input.mentionedUids,
    createdAt: serverTimestamp(),
  });
}

export async function editComment(
  wardId: string,
  date: string,
  commentId: string,
  body: string,
  mentionedUids: string[],
): Promise<void> {
  await updateDoc(commentRef(wardId, date, commentId), {
    body,
    mentionedUids,
    editedAt: serverTimestamp(),
  });
}

export async function softDeleteComment(
  wardId: string,
  date: string,
  commentId: string,
): Promise<void> {
  await updateDoc(commentRef(wardId, date, commentId), {
    deletedAt: serverTimestamp(),
  });
}
