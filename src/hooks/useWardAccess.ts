import { useEffect, useState } from "react";
import {
  collectionGroup,
  onSnapshot,
  query,
  where,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";

export interface MemberAccess {
  wardId: string;
  uid: string;
  displayName: string;
  email: string;
}

export type AccessState =
  | { kind: "checking" }
  | { kind: "none" }
  | { kind: "single"; member: MemberAccess }
  | { kind: "multiple"; members: MemberAccess[] };

export function deriveAccess(members: MemberAccess[]): AccessState {
  if (members.length === 0) return { kind: "none" };
  if (members.length === 1) {
    const [first] = members;
    if (!first) return { kind: "none" };
    return { kind: "single", member: first };
  }
  return { kind: "multiple", members };
}

function toMemberAccess(snap: QueryDocumentSnapshot): MemberAccess {
  const wardRef = snap.ref.parent.parent;
  if (!wardRef) {
    throw new Error(`Orphan member doc at ${snap.ref.path}`);
  }
  return {
    wardId: wardRef.id,
    uid: snap.id,
    displayName: (snap.get("displayName") as string | undefined) ?? "",
    email: (snap.get("email") as string | undefined) ?? "",
  };
}

export function useWardAccess(): AccessState {
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? null;
  const [state, setState] = useState<AccessState>({ kind: "checking" });

  useEffect(() => {
    // Signed-in but no email (e.g. Firebase Phone Auth) — the ward
    // allowlist is keyed on email, so they're definitionally not a
    // member. Resolve to "none" instead of staying "checking"
    // forever, which would keep the AuthGate stuck on Loading…
    if (user && !email) {
      setState({ kind: "none" });
      return;
    }
    if (!email) {
      setState({ kind: "checking" });
      return;
    }

    setState({ kind: "checking" });
    const q = query(
      collectionGroup(db, "members"),
      where("email", "==", email),
      where("active", "==", true),
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        setState(deriveAccess(snap.docs.map(toMemberAccess)));
      },
      (err) => {
        console.error("ward access query failed", err);
        setState({ kind: "none" });
      },
    );
    return unsub;
  }, [user, email]);

  return state;
}
