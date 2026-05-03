import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { letterCanvasToPdf } from "@/features/page-editor/utils/letterToPdf";
import { downloadFile, shareLetterPdf } from "@/features/page-editor/utils/shareLetterPdf";
import { LetterCanvas } from "@/features/templates/LetterCanvas";
import { formatVersionTimestamp } from "@/features/templates/utils/letterDates";
import type { SpeakerInvitation } from "@/lib/types";

interface Result {
  /** Fire to render the snapshot portal, capture the PDF, and hand it
   *  to the platform-appropriate sink (Web Share on mobile, direct
   *  download on desktop). Throws on capture failure. */
  trigger: () => Promise<void>;
  /** True while the PDF is being generated — disable any UI that
   *  shouldn't fire a parallel capture. */
  busy: boolean;
  /** Render this in the host component to keep the transient portal
   *  in the React tree. Returns null when no capture is in flight. */
  portal: React.ReactNode;
}

const PORTAL_ATTR = "data-sent-invitation-portal";

/** Captures the *originally sent* invitation letter as a PDF and
 *  hands it to the OS share sheet (mobile) or downloads it (desktop).
 *  Renders a transient hidden LetterCanvas portal sourced from the
 *  frozen invitation snapshot — the bishop always sees what the
 *  speaker actually received, even after the ward template was
 *  edited downstream. The portal uses its own data attribute so it
 *  never collides with the prepare page's `[data-print-only-letter]`
 *  selector. */
export function useDownloadSentLetter(invitation: SpeakerInvitation, invitationId: string): Result {
  const isMobile = useIsMobile();
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  // Resolves once the off-screen portal has mounted into the DOM —
  // letterCanvasToPdf needs an actual HTMLElement, and React doesn't
  // give us a synchronous "node attached" callback otherwise.
  const mountedResolverRef = useRef<(() => void) | null>(null);
  const mountedPromiseRef = useRef<Promise<void> | null>(null);

  const trigger = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    mountedPromiseRef.current = new Promise<void>((resolve) => {
      mountedResolverRef.current = resolve;
    });
    setActive(true);
    try {
      await mountedPromiseRef.current;
      const target = document.querySelector<HTMLElement>(`[${PORTAL_ATTR}]`);
      if (!target) throw new Error("Couldn't render the sent letter for download.");
      const filename = pdfFilename(invitation.speakerName, invitation.speakerRef.meetingDate);
      const { file } = await letterCanvasToPdf(target, filename);
      if (isMobile) {
        await shareLetterPdf(file, filename, `Invitation for ${invitation.speakerName}`);
      } else {
        downloadFile(file, filename);
      }
    } finally {
      setActive(false);
      setBusy(false);
      mountedResolverRef.current = null;
      mountedPromiseRef.current = null;
    }
  }, [busy, invitation, isMobile]);

  return {
    trigger,
    busy,
    portal: active ? (
      <SentLetterPortal
        invitation={invitation}
        invitationId={invitationId}
        onMounted={() => mountedResolverRef.current?.()}
      />
    ) : null,
  };
}

interface PortalProps {
  invitation: SpeakerInvitation;
  invitationId: string;
  onMounted: () => void;
}

/** Off-screen rendered copy of the invitation snapshot. Stays in the
 *  React tree only during a capture window; styled by the global
 *  `[data-print-only-letter]` rule analogue applied via the portal
 *  attribute so it never paints on screen — `letterCanvasToPdf`
 *  parks it at `left: -100000px` for the duration of the html2canvas
 *  call, then reverts. */
function SentLetterPortal({ invitation, invitationId, onMounted }: PortalProps) {
  useEffect(() => {
    onMounted();
  }, [onMounted]);
  const stampText = formatVersionTimestamp(invitation.createdAt);
  const versionStamp = stampText ? ({ label: "Sent", text: stampText } as const) : undefined;
  return createPortal(
    <div data-sent-invitation-portal={invitationId} style={{ display: "none" }}>
      <LetterCanvas
        wardName={invitation.wardName}
        assignedDate={invitation.assignedDate}
        today={invitation.sentOn}
        bodyMarkdown={invitation.bodyMarkdown}
        footerMarkdown={invitation.footerMarkdown}
        {...(invitation.editorStateJson ? { editorStateJson: invitation.editorStateJson } : {})}
        {...(versionStamp ? { versionStamp } : {})}
      />
    </div>,
    document.body,
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
