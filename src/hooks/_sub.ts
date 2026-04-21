import { useEffect, useState } from "react";
import { collection, doc, onSnapshot } from "firebase/firestore";
import type { ZodType } from "zod";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";

export interface SubState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
}

export interface DocSubState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

const JOIN = "/";

export function useDocSnapshot<T>(
  segments: readonly (string | null | undefined)[],
  schema: ZodType<T>,
): DocSubState<T> {
  const authStatus = useAuthStore((s) => s.status);
  const signedIn = authStatus === "signed_in";
  const authLoading = authStatus === "loading";
  const ready =
    signedIn && segments.every((s): s is string => typeof s === "string" && s.length > 0);
  const key = ready ? segments.join(JOIN) : null;
  const [state, setState] = useState<DocSubState<T>>({
    data: null,
    loading: ready || authLoading,
    error: null,
  });

  useEffect(() => {
    if (!key) {
      // Treat the auth-loading window as "still loading" so callers don't
      // briefly render empty states while the sign-in handshake resolves.
      setState({ data: null, loading: authLoading, error: null });
      return;
    }
    setState({ data: null, loading: true, error: null });
    const ref = doc(db, key);
    return onSnapshot(
      ref,
      (snap) => {
        if (!snap.exists()) {
          setState({ data: null, loading: false, error: null });
          return;
        }
        const parsed = schema.safeParse(snap.data());
        setState(
          parsed.success
            ? { data: parsed.data, loading: false, error: null }
            : { data: null, loading: false, error: parsed.error },
        );
      },
      (error) => setState({ data: null, loading: false, error }),
    );
  }, [key, schema, authLoading]);

  return state;
}

export interface WithId<T> {
  id: string;
  data: T;
}

export function useCollectionSnapshot<T>(
  segments: readonly (string | null | undefined)[],
  schema: ZodType<T>,
): SubState<WithId<T>[]> {
  const authStatus = useAuthStore((s) => s.status);
  const signedIn = authStatus === "signed_in";
  const authLoading = authStatus === "loading";
  const ready =
    signedIn && segments.every((s): s is string => typeof s === "string" && s.length > 0);
  const key = ready ? segments.join(JOIN) : null;
  const [state, setState] = useState<SubState<WithId<T>[]>>({
    data: [],
    loading: ready || authLoading,
    error: null,
  });

  useEffect(() => {
    if (!key) {
      setState({ data: [], loading: authLoading, error: null });
      return;
    }
    setState({ data: [], loading: true, error: null });
    return onSnapshot(
      collection(db, key),
      (snap) => {
        const items: WithId<T>[] = [];
        for (const d of snap.docs) {
          const parsed = schema.safeParse(d.data());
          if (!parsed.success) {
            // Skip + log. One malformed doc shouldn't blank the whole list --
            // that just makes recovery harder for the user.
            console.error(`Schema parse failed at ${key}/${d.id}`, parsed.error);
            continue;
          }
          items.push({ id: d.id, data: parsed.data });
        }
        setState({ data: items, loading: false, error: null });
      },
      (error) => setState({ data: [], loading: false, error }),
    );
  }, [key, schema, authLoading]);

  return state;
}
