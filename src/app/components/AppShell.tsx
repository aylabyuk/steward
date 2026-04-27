import { useEffect } from "react";
import { Outlet } from "react-router";
import { BuiltByCredit } from "@/components/BuiltByCredit";
import { useHideOnScroll } from "./hooks/useHideOnScroll";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useUserMenuStore } from "@/stores/userMenuStore";
import { cn } from "@/lib/cn";
import { OnlineStatusBanner } from "./OnlineStatusBanner";
import { Topbar } from "./Topbar";
import { UserSideDrawer } from "./UserSideDrawer";

export function AppShell() {
  const isMobile = useIsMobile();
  const hidden = useHideOnScroll(isMobile);
  const drawerOpen = useUserMenuStore((s) => s.open);
  // The mobile drawer "pushes" the page off-screen left so a small
  // peek of the page stays visible on the right of the drawer. Lock
  // body horizontal overflow while open so the off-screen content
  // can't be panned into view.
  useEffect(() => {
    if (!drawerOpen || !isMobile) return;
    const prev = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = prev;
    };
  }, [drawerOpen, isMobile]);

  const pushed = drawerOpen && isMobile;

  return (
    <div className="min-h-dvh bg-parchment paper-grain overflow-x-hidden">
      <div
        className={cn(
          "min-h-dvh flex flex-col transition-transform duration-300 ease-out will-change-transform",
          pushed && "-translate-x-[85vw]",
        )}
        // While pushed, taps on the visible peek shouldn't activate
        // the page underneath — the side drawer's own backdrop button
        // handles dismissal.
        aria-hidden={pushed}
      >
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
      </div>
      <UserSideDrawer />
    </div>
  );
}
