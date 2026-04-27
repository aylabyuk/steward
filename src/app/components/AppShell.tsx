import { Outlet } from "react-router";
import { BuiltByCredit } from "@/components/BuiltByCredit";
import { OnlineStatusBanner } from "./OnlineStatusBanner";
import { Topbar } from "./Topbar";

export function AppShell() {
  return (
    <div className="flex min-h-dvh flex-col bg-parchment paper-grain">
      {/* Topbar + connection banner travel together — wrapping them in a
          single sticky container keeps the banner pinned right below the
          topbar without depending on a hardcoded topbar height. */}
      <div className="sticky top-0 z-20">
        <Topbar />
        <OnlineStatusBanner />
      </div>
      <div className="flex flex-1 flex-col w-full max-w-380 mx-auto px-4 sm:px-8 pt-4 sm:pt-7">
        <Outlet />
      </div>
      <footer className="flex justify-center py-3 px-4">
        <BuiltByCredit />
      </footer>
    </div>
  );
}
