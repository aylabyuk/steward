import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { Avatar } from "@/components/ui/Avatar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { cn } from "@/lib/cn";

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
              <div className="truncate text-xs uppercase tracking-wider text-walnut-3">
                {user?.email}
              </div>
            </div>
          </div>

          <MenuLink to="/settings/profile" onClick={close}>
            Profile
          </MenuLink>
          <MenuLink to="/settings/ward" onClick={close}>
            Ward settings
          </MenuLink>

          <div className="border-t border-border" />

          <MenuLink to="/settings/templates/speaker-invitation" onClick={close} newTab>
            Speaker invitation template
          </MenuLink>
          <MenuLink to="/settings/templates/ward-invites" onClick={close}>
            Ward invitation message
          </MenuLink>

          <div className="border-t border-border" />

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

interface MenuLinkProps {
  to: string;
  onClick: () => void;
  newTab?: boolean;
  children: React.ReactNode;
}

function MenuLink({ to, onClick, newTab, children }: MenuLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      role="menuitem"
      className="block px-2.5 py-2 text-sm text-walnut transition-colors hover:rounded hover:bg-parchment-2"
    >
      {children}
      {newTab && (
        <span
          aria-label="Opens in a new tab"
          className="ml-2 font-mono text-[9px] uppercase tracking-[0.14em] text-walnut-3"
        >
          ↗
        </span>
      )}
    </Link>
  );
}
