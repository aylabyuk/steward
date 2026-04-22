import { Outlet } from "react-router";
import { cn } from "@/lib/cn";
import { OnlineStatusBanner } from "./OnlineStatusBanner";
import { Topbar } from "./Topbar";

interface Props {
  /** When true, the content column drops its `max-w-380` cap and
   *  spans the full viewport width (topbar + banner stay). Used for
   *  editor-heavy routes where a wide preview needs every pixel. */
  fullWidth?: boolean | undefined;
}

export function AppShell({ fullWidth }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-parchment paper-grain">
      {/* Topbar + connection banner travel together — wrapping them in a
          single sticky container keeps the banner pinned right below the
          topbar without depending on a hardcoded topbar height. */}
      <div className="sticky top-0 z-20">
        <Topbar />
        <OnlineStatusBanner />
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col w-full mx-auto px-4 sm:px-8 pt-4 sm:pt-7",
          !fullWidth && "max-w-380",
        )}
      >
        <Outlet />
      </div>
    </div>
  );
}
