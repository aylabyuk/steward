import { useEffect, useRef, useState } from "react";

/** Click-outside-to-close popover state. Lifted from the design
 *  kit's `usePopover` so each toolbar dropdown can use the same
 *  `{ open, setOpen, ref }` shape. */
export function usePopover() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);
  return { open, setOpen, ref };
}
