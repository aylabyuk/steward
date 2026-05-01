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
  const ready =
    signedIn && segments.every((s): s is string => typeof s === "string" && s.length > 0);
  const key = ready ? segments.join(JOIN) : null;
  // Always start in `loading: true` — the very first React commit
  // happens *before* any effect can subscribe, so callers can't be
  // allowed to treat that pre-subscription frame as "loaded with no
  // data". (Earlier code used `ready || authLoading` here, which
  // surfaced loading=false in the brief window where auth had
  // resolved but `wardId` was still being hydrated from the
  // current-ward store. The speaker-letter editor read that as "no
  // template exists, seed defaults" and locked seeded=true before
  // the real onSnapshot fired.)
  const [state, setState] = useState<DocSubState<T>>({
    data: null,
    loading: true,
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
    // Firestore fires onSnapshot up to twice on first subscribe:
    // once with `metadata.fromCache: true` (local cache) before the
    // server response arrives, and again with `fromCache: false` once
    // it does. When the cache is empty (first visit OR right after a
    // write that hasn't propagated to the local listener yet) the
    // cache-miss fire reports `snap.exists() === false` even though
    // the server may have the doc — defer the cache-miss for a short
    // window so callers don't seed defaults against a transient false
    // negative. If the server doesn't disagree within the window,
    // treat the cache miss as authoritative — otherwise paths that
    // genuinely don't exist (e.g. a prayer slot the bishop never
    // promoted) hang at `loading: true` forever and the only way out
    // is a hard page reload.
    let cacheMissTimer: ReturnType<typeof setTimeout> | null = null;
    const clearCacheMissTimer = () => {
      if (cacheMissTimer !== null) {
        clearTimeout(cacheMissTimer);
        cacheMissTimer = null;
      }
    };
    const unsub = onSnapshot(
      ref,
      (snap) => {
        if (snap.metadata.fromCache && !snap.exists()) {
          if (cacheMissTimer !== null) return;
          cacheMissTimer = setTimeout(() => {
            cacheMissTimer = null;
            setState((prev) => (prev.loading ? { data: null, loading: false, error: null } : prev));
          }, 1500);
          return;
        }
        clearCacheMissTimer();
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
      (error) => {
        clearCacheMissTimer();
        setState({ data: null, loading: false, error });
      },
    );
    return () => {
      clearCacheMissTimer();
      unsub();
    };
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
  const ready =
    signedIn && segments.every((s): s is string => typeof s === "string" && s.length > 0);
  const key = ready ? segments.join(JOIN) : null;
  // Same rationale as useDocSnapshot — always start loading=true so
  // callers don't read the pre-subscription frame as "loaded empty".
  const [state, setState] = useState<SubState<WithId<T>[]>>({
    data: [],
    loading: true,
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
