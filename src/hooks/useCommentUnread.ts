import { useCommentReadStore, readsKey } from "@/stores/commentReadStore";
import { useComments } from "./useComments";

interface TimestampLike {
  toDate?: () => Date;
}

function toMs(raw: unknown): number {
  const t = raw as TimestampLike | Date | null | undefined;
  if (!t) return 0;
  if (t instanceof Date) return t.getTime();
  if (typeof t.toDate === "function") {
    const d = t.toDate();
    return d ? d.getTime() : 0;
  }
  return 0;
}

export interface CommentBadge {
  count: number;
  unread: boolean;
}

export function useCommentUnread(wardId: string, date: string): CommentBadge {
  const { data } = useComments(date);
  const lastRead = useCommentReadStore((s) => s.reads[readsKey(wardId, date)]) ?? 0;
  const visible = data.filter((c) => !c.data.deletedAt);
  const unread = visible.some((c) => toMs(c.data.createdAt) > lastRead);
  return { count: visible.length, unread };
}
