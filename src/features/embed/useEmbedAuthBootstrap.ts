import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";

export type EmbedAuthStatus =
  | { status: "skip" }
  | { status: "pending" }
  | { status: "ready" }
  | { status: "no-token" }
  | { status: "error"; error: Error };

/** Bootstraps auth + ward selection for an iOS WebView opening one of
 *  the prepare pages with `?embed=ios`. The flow is:
 *
 *    1. Read `#token=<jwt>` from `window.location.hash`. If present,
 *       `signInWithCustomToken(auth, token)` (main app instance, so the
 *       existing data hooks unblock without changes), then strip the
 *       fragment from the address bar so it can't leak via screenshots
 *       or back-navigation.
 *    2. If `?ward=<id>` is present, seed `currentWardStore.wardId`
 *       directly so multi-ward bishops don't see the WardPicker chrome
 *       inside the WebView. AuthGate's auto-seed still runs for
 *       single-ward bishops.
 *    3. Once `useAuthStore.status === "signed_in"`, return `{ ready }`.
 *
 *  Custom-token sign-in is shared with the main `auth` (rather than an
 *  isolated app instance) on purpose: the embed UID equals the bishop's
 *  own UID, so collapsing the two contexts is what lets every existing
 *  data hook (`useMeeting`, `useSpeakers`, …) work unchanged. */
export function useEmbedAuthBootstrap(): EmbedAuthStatus {
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "ios";
  const wardParam = searchParams.get("ward");
  const setWardId = useCurrentWardStore((s) => s.setWardId);
  const authStatus = useAuthStore((s) => s.status);

  const [state, setState] = useState<EmbedAuthStatus>(
    isEmbed ? { status: "pending" } : { status: "skip" },
  );

  useEffect(() => {
    if (!isEmbed) return;
    if (wardParam) setWardId(wardParam);

    const token = readTokenFromHash();
    if (!token) {
      // No fragment token. If the user is already signed in (re-entering
      // the WebView before TTL), let them through. Otherwise stall — the
      // host iOS app should re-mint and reload.
      if (authStatus === "signed_in") setState({ status: "ready" });
      else if (authStatus === "signed_out") setState({ status: "no-token" });
      return;
    }

    // Scrub the fragment from the URL bar before sign-in so back/share
    // surfaces never reveal the token, even on failure.
    scrubHash();

    let cancelled = false;
    void signInWithCustomToken(auth, token)
      .then(() => {
        if (!cancelled) setState({ status: "ready" });
      })
      .catch((err) => {
        if (!cancelled) setState({ status: "error", error: err as Error });
      });

    return () => {
      cancelled = true;
    };
  }, [isEmbed, wardParam, setWardId, authStatus]);

  if (!isEmbed) return { status: "skip" };
  return state;
}

function readTokenFromHash(): string | null {
  if (typeof window === "undefined") return null;
  return parseTokenFromHash(window.location.hash);
}

/** Pure extractor for the `#token=<jwt>` URL fragment. Lifted out of
 *  the hook so unit tests don't have to fake `window.location`. */
export function parseTokenFromHash(hash: string): string | null {
  const raw = hash.replace(/^#/, "");
  if (!raw) return null;
  const params = new URLSearchParams(raw);
  const token = params.get("token");
  return token && token.length > 0 ? token : null;
}

function scrubHash(): void {
  if (typeof window === "undefined") return;
  const url = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState(null, "", url);
}
