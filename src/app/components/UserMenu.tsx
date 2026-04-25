import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/cn";
import { MenuItemDisabled, MenuLink, MenuLinkWithToggle } from "./UserMenuItems";
import { useDevicePushToggle } from "./useDevicePushToggle";

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
  const signOut = useAuthStore((s) => s.signOut);
  const me = useCurrentMember();
  const push = useDevicePushToggle();
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
  const avatarUser = {
    uid: user?.uid ?? null,
    displayName: name,
    photoURL: user?.photoURL ?? me?.data.photoURL ?? null,
  };

  const handleSignOut = async () => {
    await signOut();
    setOpen(false);
  };
  const close = () => setOpen(false);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="inline-flex items-center gap-2.5 rounded-full border border-transparent bg-transparent px-2.5 py-1 text-walnut transition-all hover:border-border hover:bg-chalk"
      >
        <Avatar user={avatarUser} size="sm" />
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
          <div className="flex items-center gap-3 border-b border-border px-2.5 py-2.5">
            <Avatar user={avatarUser} size="lg" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-walnut">{name}</div>
              <div className="truncate text-[11px] text-walnut-3">{user?.email}</div>
            </div>
          </div>

          <MenuLink to="/settings/profile" onClick={close}>
            Profile
          </MenuLink>
          <MenuLinkWithToggle
            to="/settings/notifications"
            onClickLink={close}
            label="Notifications"
            toggleChecked={push.checked}
            toggleDisabled={!push.ready || push.busy}
            toggleAriaLabel="Push notifications on this device"
            onToggleChange={(next) => void push.toggle(next)}
          />
          <MenuLink to="/settings/ward" onClick={close}>
            Ward settings
          </MenuLink>

          <div className="border-t border-border" />

          <MenuLink to="/settings/templates" onClick={close}>
            Templates
          </MenuLink>
          <MenuItemDisabled label="About" hint="Coming soon" />

          <div className="border-t border-border" />

          <button
            onClick={handleSignOut}
            role="menuitem"
            className="w-full px-2.5 py-2 text-left text-sm text-bordeaux transition-colors hover:rounded hover:bg-danger-soft"
          >
            Sign out
          </button>

          <div className="border-t border-border" />

          <a
            href={`https://github.com/aylabyuk/steward/releases/tag/v${__APP_VERSION__}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={close}
            role="menuitem"
            aria-label={`Version ${__APP_VERSION__} — open release notes`}
            className="block px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut hover:bg-parchment-2 hover:rounded transition-colors"
          >
            v{__APP_VERSION__} ↗
          </a>
        </div>
      )}
    </div>
  );
}

