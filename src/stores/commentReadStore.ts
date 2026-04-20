import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CommentReadState {
  reads: Record<string, number>;
  markRead: (wardId: string, date: string, at?: number) => void;
}

export const useCommentReadStore = create<CommentReadState>()(
  persist(
    (set) => ({
      reads: {},
      markRead: (wardId, date, at = Date.now()) => {
        const key = `${wardId}:${date}`;
        set((s) => ({ reads: { ...s.reads, [key]: at } }));
      },
    }),
    { name: "steward.commentReads" },
  ),
);

export function readsKey(wardId: string, date: string): string {
  return `${wardId}:${date}`;
}
