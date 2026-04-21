import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  ready: boolean;
  /**
   * When true, uses tighter paper margins + paddings so the conducting
   * copy fits onto a single 8.5×11 page.
   */
  dense?: boolean;
  landscape?: boolean;
  children: ReactNode;
}

/**
 * Print-only page shell: no topbar, no sticky app chrome, chalk background,
 * walnut ink, design fonts. Triggers the browser print dialog once as soon
 * as the content is `ready` (meeting + ward data loaded).
 */
export function PrintLayout({ ready, dense, landscape, children }: Props) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!ready || triggered.current) return;
    triggered.current = true;
    // Let fonts + paint settle before the print preview snapshots the page.
    const id = setTimeout(() => window.print(), 250);
    return () => clearTimeout(id);
  }, [ready]);

  return (
    <div className="min-h-screen bg-chalk text-walnut font-serif print:bg-white print:min-h-screen print:flex print:flex-col print:justify-center">
      <div
        className={
          dense
            ? "mx-auto max-w-4xl px-6 py-6 print:px-2 print:py-0 print:w-full"
            : "mx-auto max-w-4xl px-10 py-10 print:px-6 print:py-0 print:w-full"
        }
      >
        {children}
        <PrintStyles dense={dense} landscape={landscape} />
      </div>
    </div>
  );
}

function PrintStyles({
  dense,
  landscape,
}: { dense?: boolean | undefined; landscape?: boolean | undefined }) {
  // Page-level print rules. Using a literal <style> keeps the rules scoped
  // to the print layout tree without touching the global stylesheet.
  const margin = dense ? "0.35in" : "0.5in";
  const orientation = landscape ? "landscape" : "portrait";
  return (
    <style>{`
      @media print {
        @page {
          size: letter ${orientation};
          margin: ${margin};
        }
        html, body {
          background: #fff !important;
          color: #000 !important;
        }
        .text-walnut, .text-bordeaux, .text-bordeaux-deep { color: #000 !important; }
        .text-walnut-2 { color: #222 !important; }
        .text-walnut-3 { color: #555 !important; }
        .text-brass-deep, .text-brass-soft { color: #444 !important; }
        .text-success, .text-info, .text-warning, .text-danger { color: #000 !important; }
        [class*="border-walnut"],
        [class*="border-brass"],
        [class*="border-border"] {
          border-color: #888 !important;
        }
        .print-hidden { display: none !important; }
        .print-blank {
          min-height: 1em;
        }
        a { color: inherit; text-decoration: none; }
      }
    `}</style>
  );
}
