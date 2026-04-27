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
  // peek of the page stays visible. Lock both axes of body overflow
  // while open so the off-screen content can't be panned into view
  // and the underlying page can't scroll vertically behind the drawer.
  useEffect(() => {
    if (!drawerOpen || !isMobile) return;
    const prevX = document.body.style.overflowX;
    const prevY = document.body.style.overflowY;
    document.body.style.overflowX = "hidden";
    document.body.style.overflowY = "hidden";
    return () => {
      document.body.style.overflowX = prevX;
      document.body.style.overflowY = prevY;
    };
  }, [drawerOpen, isMobile]);

  const pushed = drawerOpen && isMobile;

  return (
    <div className="min-h-dvh bg-parchment paper-grain overflow-x-hidden">
      <div
        className={cn(
          // Note: no `will-change-transform` here. Setting it would
          // promote this wrapper into a containing block for the
          // sticky-positioned descendants inside (the schedule's
          // sticky week header, etc.), breaking their stick-to-
          // viewport behavior. The 300ms translate animates fine
          // without the hint on modern browsers.
          "min-h-dvh flex flex-col transition-transform duration-300 ease-out",
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
