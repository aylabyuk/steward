import { Outlet } from "react-router";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-parchment paper-grain">
      <Topbar />
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
