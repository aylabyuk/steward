import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import { cn } from "@/lib/cn";

const EXIT_MS = 200;
const ENTER_MS = 250;
const DRAG_DISMISS_THRESHOLD = 100;
const TAP_THRESHOLD = 5;

interface Props {
  open: boolean;
  onClose: () => void;
  /** Optional small-caps eyebrow shown above the children. Mirrors the
   *  inline label that desktop popovers carry (e.g. "Sunday type"). */
  title?: string;
  children: ReactNode;
}

/** Phone-only bottom sheet. Slides up with a grab handle, locks body
 *  scroll, dismisses on backdrop tap / ESC / handle drag. The handle
 *  supports a native-feeling drag gesture: drag down to follow the
 *  finger, release past ~100px to dismiss, release earlier to snap
 *  back. Portaled to `document.body` so `position: fixed` always
 *  anchors to the viewport regardless of ancestor effects. */
export function MobileBottomSheet({ open, onClose, title, children }: Props) {
  const [mounted, setMounted] = useState(open);
  const [exiting, setExiting] = useState(false);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const startYRef = useRef(0);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setExiting(false);
      return;
    }
    if (!mounted) return;
    setExiting(true);
    const t = setTimeout(() => {
      setMounted(false);
      setExiting(false);
    }, EXIT_MS);
    return () => clearTimeout(t);
  }, [open, mounted]);

  // Once the entrance animation is done, swap to "no animation class"
  // so the entrance doesn't replay when state changes (e.g. after a
  // snap-back) re-render the sheet.
  useEffect(() => {
    if (!mounted) {
      setEntered(false);
      return;
    }
    const t = setTimeout(() => setEntered(true), ENTER_MS);
    return () => clearTimeout(t);
  }, [mounted]);

  useLockBodyScroll(mounted && !exiting);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onClose]);

  function onPointerDown(e: React.PointerEvent<HTMLButtonElement>) {
    if (!entered || exiting) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startYRef.current = e.clientY;
    setDragging(true);
    setSnapping(false);
    setDragY(0);
  }

  function onPointerMove(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    setDragY(Math.max(0, e.clientY - startYRef.current));
  }

  function onPointerEnd(e: React.PointerEvent<HTMLButtonElement>) {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
    if (dragY < TAP_THRESHOLD) {
      onClose();
      return;
    }
    if (dragY > DRAG_DISMISS_THRESHOLD) {
      // Continue the slide off-screen via CSS transition, then unmount
      // through the parent's open=false flow. Snapping stays `true`
      // through unmount so the inline transform keeps the sheet
      // off-screen — no late jump back to 0% from the CSS exit class.
      setSnapping(true);
      setDragY(window.innerHeight);
      setTimeout(() => onClose(), EXIT_MS);
      return;
    }
    setSnapping(true);
    setDragY(0);
    setTimeout(() => setSnapping(false), 220);
  }

  if (!mounted) return null;
  if (typeof document === "undefined") return null;

  const dragControlled = dragging || snapping;
  const inlineStyle: CSSProperties = dragControlled
    ? {
        transform: `translateY(${dragY}px)`,
        transition: snapping ? "transform 200ms cubic-bezier(0.22,1,0.36,1)" : "none",
      }
    : {};

  let sheetAnim = "";
  if (!dragControlled) {
    if (exiting) sheetAnim = "animate-[drawerSlideDown_200ms_cubic-bezier(0.4,0,1,1)_forwards]";
    else if (!entered)
      sheetAnim = "animate-[drawerSlideUp_220ms_cubic-bezier(0.22,1,0.36,1)_backwards]";
  }

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-40 bg-[rgba(35,24,21,0.32)] flex items-end justify-center",
        exiting
          ? "animate-[fadeOut_180ms_ease-in_forwards]"
          : "animate-[fade_160ms_ease-out_backwards]",
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "bg-chalk flex flex-col w-full max-h-[75dvh] rounded-t-[18px] border-t border-x border-border-strong shadow-elev-3 overflow-hidden pb-[max(0.75rem,env(safe-area-inset-bottom))]",
          sheetAnim,
        )}
        style={inlineStyle}
      >
        <button
          type="button"
          aria-label="Close"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          className="flex-none flex items-center justify-center pt-2.5 pb-1.5 hover:bg-[rgba(35,24,21,0.04)] cursor-grab active:cursor-grabbing touch-none"
        >
          <span className="block w-10 h-1 rounded-full bg-walnut-2/40" />
        </button>
        {title && (
          <div className="px-4 pt-1 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-walnut-3">
            {title}
          </div>
        )}
        <div className="overflow-y-auto px-2 pb-2">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
