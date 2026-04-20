import { useEffect } from "react";
import { Navigate } from "react-router";
import { WardPicker } from "@/app/components/ward-picker";
import { useWardAccess } from "@/hooks/useWardAccess";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { AccessRequired } from "./access-required";

function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-600">
      <p>Loading…</p>
    </main>
  );
}

export function Home() {
  const { user, status, signOut } = useAuthStore();
  const access = useWardAccess();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const setWardId = useCurrentWardStore((s) => s.setWardId);

  useEffect(() => {
    if (access.kind === "single") {
      setWardId(access.member.wardId);
    } else if (access.kind === "none") {
      setWardId(null);
    }
  }, [access, setWardId]);

  if (status === "loading") return <Loading />;
  if (status === "signed_out" || !user) return <Navigate to="/login" replace />;
  if (access.kind === "checking") return <Loading />;
  if (access.kind === "none") return <AccessRequired />;
  if (access.kind === "multiple" && !wardId) {
    return <WardPicker members={access.members} />;
  }

  const activeWardId = access.kind === "single" ? access.member.wardId : wardId;

  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-900">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Steward</h1>
        <p className="mt-2 text-sm text-slate-600">Signed in as {user.email ?? user.uid}.</p>
        <p className="mt-1 text-xs text-slate-500">Ward: {activeWardId}</p>
        <button
          type="button"
          onClick={() => {
            void signOut();
          }}
          className="mt-4 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100"
        >
          Sign out
        </button>
      </div>
    </main>
  );
}
