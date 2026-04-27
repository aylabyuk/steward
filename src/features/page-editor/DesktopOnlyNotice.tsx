import { useState } from "react";
import { Link } from "react-router";

interface Props {
  /** Headline shown above the explainer copy. e.g. "Speaker invitation
   *  letter". */
  title: string;
  /** Absolute URL the bishop can paste into a desktop browser to
   *  reach this editor. Defaults to the current `window.location.href`
   *  on click. */
  url?: string;
}

/** Empty-state shown in place of the WYSIWYG template editors when
 *  the viewport is narrower than `md`. The editor canvas is an 8.5×11
 *  page at print scale — usable on tablet+ but cramped on phones —
 *  so we render a friendly explainer with a "Copy link" button the
 *  bishop can paste into their laptop browser instead of half-
 *  rendering an editor that can't be operated. */
export function DesktopOnlyNotice({ title, url }: Props): React.ReactElement {
  const [copied, setCopied] = useState(false);

  function copyLink() {
    const target = url ?? (typeof window === "undefined" ? "" : window.location.href);
    if (!target || !navigator.clipboard) return;
    void navigator.clipboard.writeText(target).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <main className="min-h-dvh bg-parchment flex flex-col">
      <header className="shrink-0 border-b border-border bg-chalk px-5 py-4">
        <Link
          to="/settings/templates"
          className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
        >
          ← Templates
        </Link>
        <h1 className="font-display text-[22px] font-semibold text-walnut leading-tight mt-1">
          {title}
        </h1>
      </header>

      <div className="flex-1 flex items-center justify-center px-5 py-10">
        <div className="max-w-sm w-full bg-chalk border border-border rounded-lg p-6 text-center shadow-elev-1">
          <div
            aria-hidden
            className="w-11 h-11 mx-auto mb-4 rounded-full border border-brass-soft bg-brass-soft/30 flex items-center justify-center text-brass-deep"
          >
            <DesktopIcon />
          </div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1.5">
            Desktop only
          </div>
          <h2 className="font-display text-[20px] font-semibold text-walnut mb-2">
            Open this on a larger screen
          </h2>
          <p className="font-serif text-[14px] text-walnut-2 mb-5">
            Template editing needs the full width of a laptop or tablet — the page is laid out at
            print size (8.5 × 11). Open this link on your desktop to keep editing.
          </p>
          <button
            type="button"
            onClick={copyLink}
            className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] transition-colors px-4 py-2 font-sans text-[13px] font-semibold"
          >
            {copied ? "Link copied" : "Copy link"}
            {copied ? <CheckIcon /> : <CopyIcon />}
          </button>
        </div>
      </div>
    </main>
  );
}

function DesktopIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M5 15V5a1 1 0 0 1 1-1h10" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}
