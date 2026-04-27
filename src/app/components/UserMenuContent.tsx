import { Avatar } from "@/components/ui/Avatar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { MenuItemDisabled, MenuLink, MenuLinkWithToggle } from "./UserMenuItems";
import { useDevicePushToggle } from "./hooks/useDevicePushToggle";

interface Props {
  /** Closes the surface that's hosting the content (popover on
   *  desktop, side drawer on mobile). Called after each link nav so
   *  the surface dismisses on selection. */
  onClose: () => void;
}

/** The body of the user menu — header with avatar/name/email, the
 *  navigation items, sign-out, and the version link. Shared between
 *  the desktop popover (rendered inline next to the trigger) and the
 *  mobile side drawer (rendered at AppShell level so it can push the
 *  page content). */
export function UserMenuContent({ onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const me = useCurrentMember();
  const push = useDevicePushToggle();

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
    onClose();
  };

  return (
    <>
      <div className="flex items-center gap-3 border-b border-border px-2.5 py-2.5">
        <Avatar user={avatarUser} size="lg" />
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-walnut">{name}</div>
          <div className="truncate text-[11px] text-walnut-3">{user?.email}</div>
        </div>
      </div>

      <MenuLink to="/settings/profile" onClick={onClose}>
        Profile
      </MenuLink>
      <MenuLinkWithToggle
        to="/settings/notifications"
        onClickLink={onClose}
        label="Notifications"
        toggleChecked={push.checked}
        toggleDisabled={!push.ready || push.busy}
        toggleAriaLabel="Push notifications on this device"
        onToggleChange={(next) => void push.toggle(next)}
      />
      <MenuLink to="/settings/ward" onClick={onClose}>
        Ward settings
      </MenuLink>

      <div className="border-t border-border" />

      <MenuLink to="/settings/templates" onClick={onClose}>
        Templates
      </MenuLink>
      <MenuItemDisabled label="About" hint="Coming soon" />

      <div className="border-t border-border" />

      <button
        onClick={handleSignOut}
        type="button"
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
        onClick={onClose}
        role="menuitem"
        aria-label={`Version ${__APP_VERSION__} — open release notes`}
        className="block px-2.5 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut hover:bg-parchment-2 hover:rounded transition-colors"
      >
        v{__APP_VERSION__} ↗
      </a>
    </>
  );
}
