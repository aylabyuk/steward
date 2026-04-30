import { cn } from "@/lib/cn";

interface Props {
  /** When false the button is hidden via opacity + pointer-events
   *  rather than unmounting, so the fade is smooth. */
  visible: boolean;
  onJump: () => void;
}

/** Messages-style "scroll to latest" floating button — appears
 *  bottom-center of the schedule when the hero (first) card has
 *  scrolled out of view. The hero is the priority week (bordeaux
 *  stroke + display-tier date), so a one-tap return to it earns its
 *  weight on a 16-week-deep schedule. */
export function JumpToHeroButton({ visible, onJump }: Props) {
  return (
    <button
      type="button"
      onClick={onJump}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label="Scroll to this Sunday"
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-30 w-13 h-13 rounded-full bg-parchment/95 backdrop-blur-sm border border-border shadow-[0_8px_24px_rgba(58,37,25,0.18),0_2px_6px_rgba(58,37,25,0.08)] flex items-center justify-center text-bordeaux transition-opacity",
        visible ? "opacity-100" : "opacity-0 pointer-events-none",
      )}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
