import { useRef, type ReactNode } from "react";
import { Drawer } from "vaul";
import { useKeyboardAwareViewport } from "@/hooks/useKeyboardAwareViewport";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { CtaVariant } from "./SpeakerChatCTABanner";

interface Props {
  /** Controlled open state so the parent can auto-open when chat
   *  activity demands attention (e.g. a bishop reply lands while the
   *  drawer is collapsed). */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When set, the FAB draws attention via a pulse ring, larger size,
   *  and a variant-specific label. `null` renders the calm FAB. */
  attention?: CtaVariant | null;
  children: ReactNode;
}

/** Floating chat drawer for the speaker invite page. Collapsed, it
 *  shows a pill-shaped FAB bottom-right. Mobile gets a bottom sheet
 *  that slides up; desktop gets a side drawer that slides in from the
 *  right edge so the speaker's letter behind it stays glanceable.
 *  Vaul handles drag-to-dismiss (down on mobile, right on desktop),
 *  ESC, backdrop tap, and scroll lock; we just render the chrome. */
export function SpeakerChatFloatingDrawer({
  open,
  onOpenChange,
  attention,
  children,
}: Props): React.ReactElement {
  const isMobile = useIsMobile();
  const contentRef = useRef<HTMLDivElement | null>(null);
  // Keyboard-aware sizing only applies on the mobile fullscreen sheet.
  // Desktop is `inset-y-0 right-0` and never collides with the soft
  // keyboard.
  useKeyboardAwareViewport(contentRef, isMobile && open);
  const contentClass = isMobile
    ? "fixed inset-0 z-20 flex flex-col bg-chalk shadow-elev-3 outline-none"
    : "fixed inset-y-0 right-0 z-20 flex w-[min(26.25rem,100vw)] flex-col bg-chalk shadow-elev-3 border-l border-border-strong outline-none";
  return (
    <>
      {!open && <Fab attention={attention ?? null} onClick={() => onOpenChange(true)} />}
      <Drawer.Root
        open={open}
        onOpenChange={onOpenChange}
        direction={isMobile ? "bottom" : "right"}
        repositionInputs={false}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-20 bg-[rgba(35,24,21,0.32)]" />
          <Drawer.Content ref={contentRef} aria-describedby={undefined} className={contentClass}>
            {isMobile && (
              <Drawer.Handle className="flex-none mx-auto mt-2 mb-1 h-1 w-10 rounded-full bg-walnut-2/40" />
            )}
            <Drawer.Title className="sr-only">Conversation with the bishopric</Drawer.Title>
            {children}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

interface FabProps {
  attention?: CtaVariant | null;
  onClick: () => void;
}

function Fab({ attention, onClick }: FabProps) {
  const label =
    attention === "reply"
      ? "Reply to the bishopric"
      : attention === "unread"
        ? "New message"
        : "Conversation";
  const pulseStyle: React.CSSProperties | undefined = attention
    ? { animation: "fabPulse 1.8s ease-out infinite" }
    : undefined;
  return (
    <button
      type="button"
      onClick={onClick}
      style={pulseStyle}
      className={
        attention
          ? "fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 px-5 py-3.5 rounded-full bg-bordeaux text-parchment font-sans text-[14px] font-semibold shadow-elev-3 hover:bg-bordeaux-deep pb-[max(0.875rem,env(safe-area-inset-bottom))]"
          : "fixed bottom-4 right-4 z-20 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-bordeaux text-parchment font-sans text-[13.5px] font-semibold shadow-elev-3 hover:bg-bordeaux-deep pb-[max(0.75rem,env(safe-area-inset-bottom))]"
      }
      aria-label={`${label} — open the conversation with the bishopric`}
    >
      <ChatIcon />
      <span>{label}</span>
    </button>
  );
}

function ChatIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
