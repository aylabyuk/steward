import { create } from "zustand";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useCurrentWardStore } from "@/stores/currentWardStore";

export type AuthStatus = "loading" | "signed_out" | "signed_in";

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  status: "loading",
  signIn: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  },
  signInWithEmail: async (email, password) => {
    await signInWithEmailAndPassword(auth, email, password);
  },
  signOut: async () => {
    await fbSignOut(auth);
  },
}));

export function handleAuthChange(user: User | null): void {
  useAuthStore.setState({
    user,
    status: user ? "signed_in" : "signed_out",
  });
  // Reset the selected ward synchronously on sign-out so wardId-dependent
  // Firestore listeners tear down in the same tick. Leaving a stale wardId
  // in the store keeps zombie snapshot listeners attached through the
  // auth transition, which trips an internal Firestore assertion
  // (Unexpected state ID: b815 / ca9) when the next auth change races
  // against the listener cleanup.
  if (!user) {
    useCurrentWardStore.setState({ wardId: null });
  }
}

let listenerAttached = false;
export function initAuthListener(): void {
  if (listenerAttached) {
    return;
  }
  listenerAttached = true;
  onAuthStateChanged(auth, handleAuthChange);
}
