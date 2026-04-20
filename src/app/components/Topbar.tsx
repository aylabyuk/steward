import { UserMenu } from "./UserMenu";

export function Topbar() {
  return (
    <div className="sticky top-0 z-20 border-b border-border bg-parchment/82 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-8 py-3.5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/icons/logo-monogram.svg" alt="Steward" className="h-6 w-6" />
          <span className="font-display text-base font-semibold tracking-tight">Steward</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}
