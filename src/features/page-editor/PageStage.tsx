import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

interface Props {
  /** Current zoom factor. 1.0 = 100%; clamp to [0.4, 2.5] in the
   *  parent so the toolbar slider + buttons don't have to repeat the
   *  bounds. Applied as CSS `zoom` so the editor's contenteditable
   *  layout box scales too — keeps IME placement aligned at any
   *  level (transform-based scale historically misplaces the
   *  candidate window). */
  zoom: number;
  /** Fires when the user Ctrl/Cmd+wheels to zoom. The host updates
   *  its zoom state, which flows back via the `zoom` prop. */
  onZoomChange?: (next: number) => void;
  children: React.ReactNode;
}

/** Word-style scrollable + zoomable canvas stage. Centers its
 *  children horizontally, scrolls vertically when content overflows,
 *  and listens for Ctrl/Cmd+wheel to adjust zoom — same gesture the
 *  Lexical playground (and Word, Pages, Docs) all bind. The toolbar
 *  is rendered outside this component so it never scrolls or zooms
 *  with the page. */
export function PageStage({ zoom, onZoomChange, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onZoomChange) return;
    const el = ref.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const step = e.deltaY < 0 ? 0.1 : -0.1;
      onZoomChange(Math.max(0.4, Math.min(2.5, +(zoom + step).toFixed(2))));
    };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [zoom, onZoomChange]);

  return (
    <div
      ref={ref}
      className={cn(
        "h-full w-full overflow-auto bg-parchment",
        "[--page-gutter:2rem] py-(--page-gutter)",
      )}
    >
      <div
        className="mx-auto"
        // CSS `zoom` is the only way to scale a contenteditable
        // without breaking caret + IME positioning across modern
        // browsers (Chromium / WebKit / Gecko all compute IME from
        // the zoomed box). Width auto-shrinks alongside the visual
        // size — the parent's `mx-auto` keeps the page centered.
        style={{ zoom, width: "fit-content" }}
      >
        {children}
      </div>
    </div>
  );
}
