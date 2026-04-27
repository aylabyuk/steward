import { Outlet } from "react-router";
import { BuiltByCredit } from "@/components/BuiltByCredit";
import { useNavDirection } from "@/app/hooks/useNavDirection";
import { useHideOnScroll } from "./hooks/useHideOnScroll";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/cn";
import { OnlineStatusBanner } from "./OnlineStatusBanner";
import { Topbar } from "./Topbar";
import { UserSideDrawer } from "./UserSideDrawer";

export function AppShell() {
  const isMobile = useIsMobile();
  const hidden = useHideOnScroll(isMobile);
  useNavDirection();

  // Mobile: body scrolls. Sticky topbar with auto-hide on scroll. The
  // browser's vertical scrollbar runs full-height — fine on touch
  // devices where it's an overlay.
  // Desktop: outer is `h-dvh + overflow-hidden`; the inner content
  // wrapper owns the scroll. That way the vertical scrollbar starts
  // BELOW the topbar instead of running edge-to-edge alongside it.
  return (
    <div className="flex flex-col bg-parchment paper-grain min-h-dvh sm:h-dvh sm:overflow-hidden">
      <div
        className={cn(
          "z-20 sticky top-0 sm:static transition-transform duration-200 ease-out will-change-transform",
          hidden && "-translate-y-full",
        )}
      >
        <Topbar />
        <OnlineStatusBanner />
      </div>
      <div
        data-app-scroll
        className="flex flex-1 flex-col sm:overflow-y-auto sm:overflow-x-clip"
      >
        <div className="shell-content flex flex-1 flex-col w-full max-w-380 mx-auto px-4 sm:px-8 pt-4 sm:pt-7">
          <Outlet />
        </div>
        <footer className="flex justify-center py-3 px-4">
          <BuiltByCredit />
        </footer>
      </div>
      {isMobile && <UserSideDrawer />}
    </div>
  );
}
