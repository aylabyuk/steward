import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/cn";

function ChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const me = useCurrentMember();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  // Prefer the member doc (always written with the full name by the
  // add-member script) over the Auth-level displayName, which may only
  // be a first name depending on how the user originally signed in.
  const name = me?.data.displayName || user?.displayName || "User";
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2.5 rounded-full border border-transparent bg-transparent px-2.5 py-1 text-walnut transition-all hover:border-border hover:bg-chalk"
      >
        <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brass to-bordeaux font-display text-xs font-semibold text-chalk">
          {initials}
        </span>
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
        <span className={cn("text-walnut-3 transition-transform", open && "rotate-180")}>
          <ChevronDown size={13} />
        </span>
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-border bg-chalk shadow-elev-3 z-50 animate-[menuIn_120ms_var(--ease-out)]"
          role="menu"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-border px-2.5 py-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brass to-bordeaux font-display text-sm font-semibold text-chalk">
              {initials}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-walnut">{name}</div>
              <div className="truncate text-xs uppercase tracking-wider text-walnut-3">
                {user?.email}
              </div>
            </div>
          </div>

          {/* Items */}
          <Link
            to="/settings"
            onClick={() => setOpen(false)}
            className="block px-2.5 py-2 text-sm text-walnut transition-colors hover:rounded hover:bg-parchment-2"
          >
            Account settings
          </Link>
          <Link
            to="/settings/ward"
            onClick={() => setOpen(false)}
            className="block px-2.5 py-2 text-sm text-walnut transition-colors hover:rounded hover:bg-parchment-2"
          >
            Ward preferences
          </Link>
          <Link
            to="/settings/notifications"
            onClick={() => setOpen(false)}
            className="block px-2.5 py-2 text-sm text-walnut transition-colors hover:rounded hover:bg-parchment-2"
          >
            Notifications
          </Link>

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            role="menuitem"
            className="w-full px-2.5 py-2 text-left text-sm text-bordeaux transition-colors hover:rounded hover:bg-danger-soft"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
