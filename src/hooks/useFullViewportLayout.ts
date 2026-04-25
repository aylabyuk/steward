import { useEffect } from "react";

/** Pages that own the entire viewport (e.g. `h-dvh + overflow-hidden`)
 *  don't need the global `scrollbar-gutter: stable` rule that
 *  `index.css` reserves on `<html>`. While the page is mounted, that
 *  reserved gutter just paints an empty band on the right edge.
 *  Toggle the gutter off on mount and restore it on unmount. */
export function useFullViewportLayout(): void {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.scrollbarGutter;
    root.style.scrollbarGutter = "auto";
    return () => {
      root.style.scrollbarGutter = prev;
    };
  }, []);
}
