import { useWardSettings } from "@/hooks/useWardSettings";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  const ward = useWardSettings();
  const wardName = ward.data?.name;
  return (
    <div className="border-b border-border bg-parchment/82 backdrop-blur-sm">
      <div className="flex items-center gap-4 px-8 py-3.5">
        {/* Brand */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <img src="/icons/logo-monogram.svg" alt="Steward" className="h-6 w-6" />
          <span className="font-display text-base font-semibold tracking-tight">Steward</span>
          {wardName && (
            <>
              <span aria-hidden className="text-walnut-3">·</span>
              <span className="font-serif text-[14px] text-walnut-2 truncate max-w-[40vw]">
                {wardName}
              </span>
            </>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}
