import { useState } from "react";
import { Download, RotateCcw, Send, Share } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { letterCanvasToPdf } from "@/features/page-editor/utils/letterToPdf";
import { downloadFile, shareLetterPdf } from "@/features/page-editor/utils/shareLetterPdf";
import { PrepareInvitationDialogs } from "../PrepareInvitationDialogs";
import { PrepareInvitationGroupBtn as GroupBtn } from "../PrepareInvitationGroupBtn";
import { ToolbarSaveButton } from "./ToolbarSaveButton";

interface Props {
  busy: boolean;
  hasOverride: boolean;
  /** True when the editor state has unsaved edits. Gates the
   *  Download/Share button (must save first so the PDF + Firestore
   *  agree on what's "the letter"). */
  dirty: boolean;
  speakerName: string;
  /** Current email / phone on file for the speaker. Used to prefill
   *  the Send-channel dialog; empty strings are handled (the dialog
   *  treats them as a first-time-add flow). */
  speakerEmail: string;
  speakerPhone: string;
  /** Meeting date (ISO YYYY-MM-DD) — used for the shared PDF filename. */
  assignedDate: string;
  onRevert: () => void;
  onSave: () => void;
  /** Called with the final email the bishop confirmed in the dialog.
   *  The parent is responsible for persisting it to the speaker doc
   *  when it differs from what was on file. */
  onSend: (email: string) => void;
  onSendSms: (phone: string) => void;
}

type PendingConfirm = "revert" | null;
type PendingSend = "email" | "sms" | null;

const ICON_SIZE = 14;
const ICON_STROKE = 1.75;

/** Top-of-page action toolbar for the Prepare Invitation page.
 *  Three groups: [Revert | Share/Download], [Save], [Send Email,
 *  Send SMS]. The Share/Download split picks Share on touch viewports
 *  (Web Share API → OS share sheet) and Download on desktop (direct
 *  PDF download — no surprising "I clicked Share but got a download"
 *  fallback). Both paths are gated on `!dirty` so the artifact the
 *  bishop hands out always matches what's persisted in Firestore. */
export function PrepareInvitationActionBar({
  busy,
  hasOverride,
  dirty,
  speakerName,
  speakerEmail,
  speakerPhone,
  assignedDate,
  onRevert,
  onSave,
  onSend,
  onSendSms,
}: Props) {
  const [pending, setPending] = useState<PendingConfirm>(null);
  const [pendingSend, setPendingSend] = useState<PendingSend>(null);
  const [exporting, setExporting] = useState(false);
  const isMobile = useIsMobile();

  async function doExport() {
    if (exporting) return;
    const target = document.querySelector<HTMLElement>("[data-print-only-letter]");
    if (!target) return;
    setExporting(true);
    try {
      const filename = pdfFilename(speakerName, assignedDate);
      const { file } = await letterCanvasToPdf(target, filename);
      if (isMobile) {
        await shareLetterPdf(file, filename, `Invitation for ${speakerName}`);
      } else {
        downloadFile(file, filename);
      }
    } finally {
      setExporting(false);
    }
  }

  const exportLabel = isMobile ? "Share letter" : "Download letter";
  const exportDisabledLabel = dirty ? `Save to ${isMobile ? "share" : "download"}` : exportLabel;
  const ExportIcon = isMobile ? Share : Download;

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex isolate rounded-md shadow-[0_1px_0_rgba(35,24,21,0.08)]">
          <GroupBtn
            position="first"
            label={hasOverride ? "Clear per-speaker override" : "Revert to ward default"}
            indicator={hasOverride}
            onClick={() => setPending("revert")}
            disabled={busy}
          >
            <RotateCcw size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </GroupBtn>
          <GroupBtn
            position="last"
            label={dirty ? exportDisabledLabel : exportLabel}
            onClick={() => void doExport()}
            disabled={busy || exporting || dirty}
          >
            <ExportIcon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          </GroupBtn>
        </div>
        <ToolbarSaveButton dirty={dirty} busy={busy} onSave={onSave} />
        <button
          type="button"
          onClick={() => setPendingSend("email")}
          disabled={busy}
          aria-label="Send Email"
          className="inline-flex items-center rounded-md border border-border-strong bg-chalk px-3.5 sm:px-4 h-9 sm:h-10 text-walnut font-sans text-[13px] font-semibold tracking-[0.01em] transition-colors hover:bg-parchment-2 focus:outline-none focus:ring-2 focus:ring-bordeaux/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Send Email
        </button>
        <button
          type="button"
          onClick={() => setPendingSend("sms")}
          disabled={busy}
          aria-label="Send SMS"
          className="inline-flex items-center gap-2 rounded-md border border-bordeaux-deep bg-bordeaux px-3.5 sm:px-4 h-9 sm:h-10 text-chalk font-sans text-[13px] font-semibold tracking-[0.01em] shadow-[0_1px_0_rgba(35,24,21,0.08)] transition-colors hover:bg-bordeaux-deep focus:outline-none focus:ring-2 focus:ring-bordeaux/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-bordeaux"
        >
          <Send size={ICON_SIZE} strokeWidth={ICON_STROKE} />
          <span>Send SMS</span>
        </button>
      </div>

      <PrepareInvitationDialogs
        pending={pending}
        pendingSend={pendingSend}
        busy={busy}
        hasOverride={hasOverride}
        speakerName={speakerName}
        speakerEmail={speakerEmail}
        speakerPhone={speakerPhone}
        onCancelPending={() => setPending(null)}
        onCancelPendingSend={() => setPendingSend(null)}
        onRevert={onRevert}
        onSend={onSend}
        onSendSms={onSendSms}
      />
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
