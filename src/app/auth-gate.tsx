import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { WardPicker } from "@/app/components/ward-picker";
import { useWardAccess } from "@/hooks/useWardAccess";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { AccessRequired } from "./routes/access-required";

function Loading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-slate-50 text-slate-600">
      <p>Loading…</p>
    </main>
  );
}

export function AuthGate() {
  const status = useAuthStore((s) => s.status);
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
  if (status === "signed_out") return <Navigate to="/login" replace />;
  if (access.kind === "checking") return <Loading />;
  if (access.kind === "none") return <AccessRequired />;
  if (access.kind === "multiple" && !wardId) return <WardPicker members={access.members} />;

  return <Outlet />;
}
