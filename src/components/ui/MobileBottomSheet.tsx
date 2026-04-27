import type { ReactNode } from "react";
import { Drawer } from "vaul";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional small-caps eyebrow shown above the children. Mirrors the
   *  inline label that desktop popovers carry (e.g. "Sunday type"). */
  title?: string;
  children: ReactNode;
}

/** Phone-only bottom sheet wrapping `vaul`'s Drawer primitive — gives
 *  us native-feeling drag-to-dismiss, swipe-down on the handle, and
 *  smooth spring animations without hand-rolling pointer events. The
 *  visual treatment (parchment chrome, walnut grab handle, mono
 *  small-caps title) matches the rest of the app. */
export function MobileBottomSheet({ open, onClose, title, children }: Props) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-[rgba(35,24,21,0.32)]" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-40 mt-24 flex max-h-[75dvh] flex-col rounded-t-[18px] border-t border-x border-border-strong bg-chalk shadow-elev-3 outline-none pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div aria-hidden className="flex-none flex items-center justify-center pt-2.5 pb-1.5">
            <span className="block w-10 h-1 rounded-full bg-walnut-2/40" />
          </div>
          {title && (
            <Drawer.Title className="px-4 pt-1 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-walnut-3">
              {title}
            </Drawer.Title>
          )}
          {/* `vaul` reads the title for screen readers; a description is
           *  required for a11y but our content is a list of options that
           *  carries its own labelling. Use a visually-hidden span. */}
          <Drawer.Description className="sr-only">{title ?? "Options"}</Drawer.Description>
          <div className="overflow-y-auto px-2 pb-2">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
