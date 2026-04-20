import { create } from "zustand";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as fbSignOut,
  type User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

export type AuthStatus = "loading" | "signed_out" | "signed_in";

export interface AuthState {
  user: User | null;
  status: AuthStatus;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>(() => ({
  user: null,
  status: "loading",
  signIn: async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
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
}

let listenerAttached = false;
export function initAuthListener(): void {
  if (listenerAttached) {
    return;
  }
  listenerAttached = true;
  onAuthStateChanged(auth, handleAuthChange);
}
