import { useEffect, useState } from "react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { commentSchema, type Comment } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { WithId } from "@/hooks/_sub";

export interface CommentsState {
  data: WithId<Comment>[];
  loading: boolean;
  error: Error | null;
}

export function useComments(date: string | null): CommentsState {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const [state, setState] = useState<CommentsState>({
    data: [],
    loading: Boolean(wardId && date),
    error: null,
  });

  useEffect(() => {
    if (!wardId || !date) {
      setState({ data: [], loading: false, error: null });
      return;
    }
    setState({ data: [], loading: true, error: null });
    const q = query(
      collection(db, "wards", wardId, "meetings", date, "comments"),
      orderBy("createdAt", "asc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: WithId<Comment>[] = [];
        for (const d of snap.docs) {
          const parsed = commentSchema.safeParse(d.data());
          if (!parsed.success) {
            console.error(`Comment ${d.id} failed schema parse`, parsed.error);
            continue;
          }
          items.push({ id: d.id, data: parsed.data });
        }
        setState({ data: items, loading: false, error: null });
      },
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [wardId, date]);

  return state;
}
