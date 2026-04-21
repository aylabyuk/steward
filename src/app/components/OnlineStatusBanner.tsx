import { useEffect } from "react";
import { useOnlineStatusEffect, useOnlineStatusStore } from "@/stores/onlineStatusStore";
import { cn } from "@/lib/cn";

const RECONNECTED_VISIBLE_MS = 4000;

/**
 * Sits just below the Topbar. Shows a soft amber bar while the browser
 * is offline, and a transient green "Back online" note for a few seconds
 * after reconnecting. Stays empty otherwise.
 */
export function OnlineStatusBanner() {
  useOnlineStatusEffect();
  const online = useOnlineStatusStore((s) => s.online);
  const justReconnected = useOnlineStatusStore((s) => s.justReconnected);
  const clearReconnected = useOnlineStatusStore((s) => s.clearReconnected);

  useEffect(() => {
    if (!justReconnected) return;
    const id = setTimeout(clearReconnected, RECONNECTED_VISIBLE_MS);
    return () => clearTimeout(id);
  }, [justReconnected, clearReconnected]);

  if (online && !justReconnected) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-full border-b px-4 sm:px-8 py-2 font-sans text-[13px]",
        online
          ? "border-success-soft bg-success-soft/60 text-success"
          : "border-warning-soft bg-warning-soft/70 text-warning",
      )}
    >
      <div className="mx-auto flex max-w-380 items-center gap-2.5">
        <span
          className={cn("inline-block h-2 w-2 rounded-full", online ? "bg-success" : "bg-warning")}
        />
        <span>
          {online
            ? "Back online — your changes are syncing."
            : "You're offline — changes will sync when you're back online."}
        </span>
      </div>
    </div>
  );
}
