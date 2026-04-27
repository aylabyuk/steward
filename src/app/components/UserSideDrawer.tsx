import { Drawer } from "vaul";
import { useUserMenuStore } from "@/stores/userMenuStore";
import { UserMenuContent } from "./UserMenuContent";

/** Mobile-only right-side drawer that hosts the user menu content.
 *  Backed by `vaul`'s Drawer with `direction="right"` so we get
 *  drag-to-dismiss, ESC, backdrop tap, and spring animations as
 *  built-ins. Overlays the page (no push transform) — tap the dimmed
 *  backdrop to close. */
export function UserSideDrawer() {
  const open = useUserMenuStore((s) => s.open);
  const close = useUserMenuStore((s) => s.close);

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) close();
      }}
      direction="right"
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-[rgba(35,24,21,0.42)]" />
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-[85vw] flex-col bg-chalk shadow-elev-3 outline-none pt-[env(safe-area-inset-top)] pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        >
          <Drawer.Title className="sr-only">User menu</Drawer.Title>
          <button
            type="button"
            onClick={close}
            aria-label="Close menu"
            className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] w-9 h-9 inline-flex items-center justify-center rounded-md text-walnut-3 hover:text-walnut hover:bg-parchment-2 transition-colors z-10"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div className="flex-1 overflow-y-auto flex flex-col">
            <UserMenuContent onClose={close} />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
