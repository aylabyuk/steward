import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  ready: boolean;
  children: ReactNode;
}

/**
 * Print-only page shell: no topbar, no sticky app chrome, chalk background,
 * walnut ink, design fonts. Triggers the browser print dialog once as soon
 * as the content is `ready` (meeting + ward data loaded).
 */
export function PrintLayout({ ready, children }: Props) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!ready || triggered.current) return;
    triggered.current = true;
    // Let fonts + paint settle before the print preview snapshots the page.
    const id = setTimeout(() => window.print(), 250);
    return () => clearTimeout(id);
  }, [ready]);

  return (
    <div className="min-h-screen bg-chalk text-walnut font-serif print:bg-white">
      <div className="mx-auto max-w-4xl px-10 py-10 print:px-6 print:py-0">
        {children}
        <PrintStyles />
      </div>
    </div>
  );
}

function PrintStyles() {
  // Page-level print rules. Using a literal <style> keeps the rules scoped
  // to the print layout tree without touching the global stylesheet.
  return (
    <style>{`
      @media print {
        @page {
          size: letter portrait;
          margin: 0.5in 0.5in 0.5in 0.5in;
        }
        html, body {
          background: #fff !important;
          color: #2b1b13 !important;
        }
        .print-hidden { display: none !important; }
        .print-blank {
          border-bottom: 1px solid #b99e6e;
          min-height: 1em;
        }
        a { color: inherit; text-decoration: none; }
      }
    `}</style>
  );
}
