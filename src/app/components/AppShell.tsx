import { Outlet } from "react-router";
import { BuiltByCredit } from "@/components/BuiltByCredit";
import { useHideOnScroll } from "./hooks/useHideOnScroll";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { OnlineStatusBanner } from "./OnlineStatusBanner";
import { Topbar } from "./Topbar";
import { UserSideDrawer } from "./UserSideDrawer";

export function AppShell() {
  const isMobile = useIsMobile();
  const hidden = useHideOnScroll(isMobile);

  return (
    <div className="flex min-h-dvh flex-col bg-parchment paper-grain">
      <div
        className={cn(
          "sticky top-0 z-20 transition-transform duration-200 ease-out will-change-transform",
          hidden && "-translate-y-full",
        )}
      >
        <Topbar />
        <OnlineStatusBanner />
      </div>
      <div className="flex flex-1 flex-col w-full max-w-380 mx-auto px-4 sm:px-8 pt-4 sm:pt-7">
        <Outlet />
      </div>
      <footer className="flex justify-center py-3 px-4">
        <BuiltByCredit />
      </footer>
      {isMobile && <UserSideDrawer />}
    </div>
  );
}
