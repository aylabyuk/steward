import { useEffect, useRef } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useWardAccess } from "@/hooks/useWardAccess";

/** Pushes the signed-in user's Google profile fields (`displayName`,
 *  `photoURL`) up to each ward membership doc they own, once per
 *  session per ward. Other members' avatar bubbles then pick up the
 *  real face on the next roster snapshot instead of falling back to
 *  initials.
 *
 *  Safe to call unconditionally from inside the auth gate — the hook
 *  no-ops when the user isn't signed in, or isn't a member of any
 *  ward, or the fields haven't changed since the last sync. */
export function useMemberProfileSync(): void {
  const user = useAuthStore((s) => s.user);
  const access = useWardAccess();
  // Track which (wardId, uid, displayName|photoURL) triples we've
  // already pushed so a rerender doesn't stream extra writes.
  const syncedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    if (access.kind !== "single" && access.kind !== "multiple") return;
    const members = access.kind === "single" ? [access.member] : access.members;
    const displayName = user.displayName ?? null;
    const photoURL = user.photoURL ?? null;
    if (!displayName && !photoURL) return;

    for (const m of members) {
      const key = `${m.wardId}/${m.uid}/${displayName ?? ""}/${photoURL ?? ""}`;
      if (syncedRef.current.has(key)) continue;
      syncedRef.current.add(key);
      const patch: Record<string, unknown> = { updatedAt: serverTimestamp() };
      if (displayName) patch.displayName = displayName;
      if (photoURL) patch.photoURL = photoURL;
      updateDoc(doc(db, "wards", m.wardId, "members", m.uid), patch).catch((err) => {
        // Non-fatal — the user can still use the app without a
        // synced avatar. Clear the synced key so a later retry (e.g.,
        // network recovery) can try again.
        console.warn("member profile sync failed", { wardId: m.wardId, err });
        syncedRef.current.delete(key);
      });
    }
  }, [user, access]);
}
