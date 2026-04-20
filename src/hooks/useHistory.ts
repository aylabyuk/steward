import { useEffect, useState } from "react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { historyEventSchema, type HistoryEvent } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { WithId } from "./_sub";

export interface HistoryState {
  data: WithId<HistoryEvent>[];
  loading: boolean;
  error: Error | null;
}

export function useHistory(date: string | null, pageSize: number): HistoryState {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const [state, setState] = useState<HistoryState>({
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
      collection(db, "wards", wardId, "meetings", date, "history"),
      orderBy("at", "desc"),
      limit(pageSize),
    );
    return onSnapshot(
      q,
      (snap) => {
        const items: WithId<HistoryEvent>[] = [];
        for (const d of snap.docs) {
          const parsed = historyEventSchema.safeParse(d.data());
          if (!parsed.success) {
            console.error(`History ${d.id} failed schema parse`, parsed.error);
            continue;
          }
          items.push({ id: d.id, data: parsed.data });
        }
        setState({ data: items, loading: false, error: null });
      },
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [wardId, date, pageSize]);

  return state;
}
