import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LetterCanvas } from "./LetterCanvas";

interface Props {
  wardName: string;
  assignedDate: string;
  today: string;
  bodyMarkdown: string;
  footerMarkdown: string;
}

/** Portals a print-only `<LetterCanvas>` into `document.body` so the
 *  `@media print` rules only have to collapse body-level siblings —
 *  no fragile ancestor-hiding traversal, no risk of nested hidden
 *  layout reserving space that forces a second blank page. On screen
 *  the portal stays `display: none` via the global stylesheet. */
export function PrintOnlyLetter(props: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(
    <div data-print-only-letter>
      <LetterCanvas {...props} />
    </div>,
    document.body,
  );
}
