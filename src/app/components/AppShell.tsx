import { Outlet } from "react-router";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-parchment paper-grain">
      <Topbar />
      <div className="flex flex-1 flex-col w-full max-w-380 mx-auto px-4 sm:px-8 pt-4 sm:pt-7">
        <Outlet />
      </div>
    </div>
  );
}
