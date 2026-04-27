import { useEffect, useRef } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { useAuthStore } from "@/stores/authStore";
import { useUserMenuStore } from "@/stores/userMenuStore";
import { cn } from "@/lib/cn";
import { UserMenuContent } from "./UserMenuContent";

function ChevronDown({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const me = useCurrentMember();
  const isMobile = useIsMobile();
  const open = useUserMenuStore((s) => s.open);
  const toggle = useUserMenuStore((s) => s.toggle);
  const close = useUserMenuStore((s) => s.close);
  const ref = useRef<HTMLDivElement>(null);

  // Outside-click + Escape only close the desktop popover. The mobile
  // side drawer handles its own dismissal (backdrop tap, drawer ESC).
  useEffect(() => {
    if (!open || isMobile) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, isMobile, close]);

  const name = me?.data.displayName || user?.displayName || "User";
  const avatarUser = {
    uid: user?.uid ?? null,
    displayName: name,
    photoURL: user?.photoURL ?? me?.data.photoURL ?? null,
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2.5 rounded-full border border-transparent bg-transparent px-2.5 py-1 text-parchment-2 sm:text-walnut transition-all hover:border-border hover:bg-chalk"
      >
        <Avatar user={avatarUser} size="sm" />
        <span className="hidden text-sm font-medium sm:inline">{name}</span>
        <span
          className={cn(
            "text-parchment-3 sm:text-walnut-3 transition-transform",
            open && "rotate-180",
          )}
        >
          <ChevronDown size={13} />
        </span>
      </button>

      {open && !isMobile && (
        <div
          className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-border bg-chalk shadow-elev-3 z-50 animate-[menuIn_120ms_var(--ease-out)]"
          role="menu"
        >
          <UserMenuContent onClose={close} />
        </div>
      )}
    </div>
  );
}
