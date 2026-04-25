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
      // Stay in `loading: true` until every path segment is ready —
      // including async-resolving ones like `wardId` from the current-
      // ward store. Without this, the brief window where auth has
      // resolved but `wardId` hasn't would surface a transient
      // `loading: false, data: null` and let consumers (e.g. the
      // speaker-letter editor) seed defaults before the real
      // subscription even starts.
      setState({ data: null, loading: true, error: null });
      return;
    }
    setState({ data: null, loading: true, error: null });
    const ref = doc(db, key);
    return onSnapshot(
      ref,
      (snap) => {
        // Firestore fires onSnapshot up to twice on first subscribe:
        // once with `metadata.fromCache: true` (local cache) before
        // the server response arrives, and again with `fromCache:
        // false` once it does. When the cache is empty (first visit
        // OR right after a write that hasn't propagated to the local
        // listener yet) the cache-miss fire reports `snap.exists() ===
        // false` even though the server has the doc — handing the
        // caller a transient "no data" state that races against the
        // authoritative result. Skip those fires so callers only see
        // a single, authoritative resolution.
        if (snap.metadata.fromCache && !snap.exists()) return;
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
  }, [key, schema]);

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
      // Match useDocSnapshot — stay loading until every path segment
      // is ready, including async-resolving wardId etc.
      setState({ data: [], loading: true, error: null });
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
  }, [key, schema]);

  return state;
}
