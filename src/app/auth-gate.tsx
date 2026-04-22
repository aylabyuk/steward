import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { AppShell } from "@/app/components/AppShell";
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

interface Props {
  /**
   * When true (default), the gate renders <AppShell /> which in turn
   * hosts the route outlet with the topbar + centered content column.
   * When false, it renders <Outlet /> directly so children can own the
   * full page chrome — used for print views that need a standalone
   * layout.
   */
  appShell?: boolean;
  /** Pass-through to AppShell: when true, the content column uses the
   *  full viewport width instead of `max-w-380`. Ignored when
   *  `appShell={false}` since those routes are already full-width. */
  fullWidth?: boolean;
}

export function AuthGate({ appShell = true, fullWidth }: Props) {
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

  return appShell ? <AppShell fullWidth={fullWidth} /> : <Outlet />;
}
