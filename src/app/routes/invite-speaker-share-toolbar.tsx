import { useState } from "react";
import { letterCanvasToPdf } from "@/features/page-editor/letterToPdf";
import { shareLetterPdf } from "@/features/page-editor/shareLetterPdf";

/** Renders the letter PDF and hands it to the OS share sheet (Web
 *  Share API on iOS / Android), falling back to a download on
 *  desktop browsers without share support. Targets the existing
 *  `[data-print-only-letter]` portal that the invite page already
 *  mounts at true 8.5×11. */
export function ShareToolbar({
  speakerName,
  assignedDate,
}: {
  speakerName: string;
  assignedDate: string;
}): React.ReactElement {
  const [busy, setBusy] = useState(false);

  async function handleShare() {
    if (busy) return;
    const target = document.querySelector<HTMLElement>("[data-print-only-letter]");
    if (!target) return;
    setBusy(true);
    try {
      const filename = pdfFilename(speakerName, assignedDate);
      const { file } = await letterCanvasToPdf(target, filename);
      await shareLetterPdf(file, filename, `Invitation for ${speakerName}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="print:hidden flex justify-end">
      <button
        type="button"
        onClick={handleShare}
        disabled={busy}
        title="Share · Save as PDF"
        aria-label="Share · Save as PDF"
        className="inline-flex items-center justify-center rounded-md border border-walnut bg-walnut w-9 h-9 text-chalk hover:bg-walnut-2 shadow-elev-2 disabled:opacity-60 disabled:cursor-progress"
      >
        {busy ? <SpinnerIcon /> : <ShareIcon />}
      </button>
    </div>
  );
}

function pdfFilename(speakerName: string, date: string): string {
  const slug = speakerName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `invitation-${slug || "speaker"}-${date}.pdf`;
}

function ShareIcon() {
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
      <path d="M12 3v13" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      className="animate-spin"
    >
      <path d="M12 3a9 9 0 1 1-6.4 2.6" />
    </svg>
  );
}
