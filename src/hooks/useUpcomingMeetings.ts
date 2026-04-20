import { useEffect, useMemo, useState } from "react";
import {
  collection,
  documentId,
  endAt,
  onSnapshot,
  orderBy,
  query,
  startAt,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { upcomingSundays } from "@/lib/dates";
import { sacramentMeetingSchema, type SacramentMeeting } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";

export interface UpcomingSlot {
  date: string;
  meeting: SacramentMeeting | null;
}

export interface UpcomingState {
  slots: UpcomingSlot[];
  loading: boolean;
  error: Error | null;
}

interface InternalState {
  byDate: Map<string, SacramentMeeting>;
  loading: boolean;
  error: Error | null;
}

export function useUpcomingMeetings(horizonWeeks: number): UpcomingState {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const dates = useMemo(
    () => upcomingSundays(new Date(), Math.max(0, horizonWeeks)),
    [horizonWeeks],
  );
  const [state, setState] = useState<InternalState>({
    byDate: new Map(),
    loading: Boolean(wardId) && dates.length > 0,
    error: null,
  });

  useEffect(() => {
    if (!wardId || dates.length === 0) {
      setState({ byDate: new Map(), loading: false, error: null });
      return;
    }
    setState({ byDate: new Map(), loading: true, error: null });
    const [first] = dates;
    const last = dates[dates.length - 1];
    if (!first || !last) return;
    const q = query(
      collection(db, "wards", wardId, "meetings"),
      orderBy(documentId()),
      startAt(first),
      endAt(last),
    );
    return onSnapshot(
      q,
      (snap) => {
        const byDate = new Map<string, SacramentMeeting>();
        for (const d of snap.docs) {
          const parsed = sacramentMeetingSchema.safeParse(d.data());
          if (!parsed.success) {
            setState({ byDate: new Map(), loading: false, error: parsed.error });
            return;
          }
          byDate.set(d.id, parsed.data);
        }
        setState({ byDate, loading: false, error: null });
      },
      (error) => setState({ byDate: new Map(), loading: false, error }),
    );
  }, [wardId, dates]);

  const slots = dates.map((date) => ({
    date,
    meeting: state.byDate.get(date) ?? null,
  }));
  return { slots, loading: state.loading, error: state.error };
}
