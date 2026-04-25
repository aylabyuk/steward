import { Link } from "react-router";
import { useWardSettings } from "@/hooks/useWardSettings";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  const ward = useWardSettings();
  const wardName = ward.data?.name;
  return (
    <div className="border-b border-border bg-parchment/82 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 py-2.5 sm:gap-4 sm:px-8 sm:py-3.5">
        <Link
          to="/"
          aria-label="Steward — back to schedule"
          className="flex items-center gap-2.5 shrink-0 -m-1 p-1 rounded-md hover:bg-parchment-2/60 transition-colors"
        >
          <img src="/icons/logo-monogram.svg" alt="" className="h-6 w-6" />
          <div className="hidden sm:flex flex-col items-center leading-none">
            <span className="font-display text-base font-semibold tracking-tight">Steward</span>
            <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-walnut-3">
              v{__APP_VERSION__}
            </span>
          </div>
        </Link>
        {wardName && (
          <>
            <span aria-hidden className="hidden sm:inline text-walnut-3">
              ·
            </span>
            <span className="font-serif text-[15px] sm:text-[14px] text-walnut sm:text-walnut-2 truncate min-w-0 flex-1 sm:flex-initial sm:max-w-[40vw]">
              {wardName}
            </span>
          </>
        )}

        <div className="hidden sm:block flex-1" />

        <UserMenu />
      </div>
    </div>
  );
}
