import { useEffect } from "react";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";
import type { Speaker, SpeakerInvitation } from "@/lib/types";
import { BishopInvitationChat } from "./BishopInvitationChat";
import { InvitationLinkActions } from "./InvitationLinkActions";

interface Props {
  open: boolean;
  onClose: () => void;
  wardId: string;
  invitationId: string;
  invitation: SpeakerInvitation;
  /** Speaker doc + its path coordinates — threaded so the chat's
   *  status banner can render the bishopric-set status and apply
   *  manual overrides via updateSpeaker. */
  speaker: Speaker;
  date: string;
  speakerId: string;
}

/** Nested modal that hosts the bishop-side chat pane from inside the
 *  Assign Speakers modal. Renders at `z-[60]` (above the Assign
 *  modal's `z-50`), and closes on Escape or backdrop click. Uses the
 *  TwilioChatProvider established higher up the tree. Full-screen on
 *  mobile (100dvh, no padding), centered modal on sm+. Background
 *  scroll is locked while open so mobile rubber-banding doesn't drag
 *  the page behind it. */
export function BishopInvitationDialog({
  open,
  onClose,
  wardId,
  invitationId,
  invitation,
  speaker,
  date,
  speakerId,
}: Props): React.ReactElement | null {
  useLockBodyScroll(open);

  useEffect(() => {
    if (!open) return;
    function handleEsc(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation();
      onClose();
    }
    document.addEventListener("keydown", handleEsc, true);
    return () => document.removeEventListener("keydown", handleEsc, true);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[60] bg-[rgba(35,24,21,0.42)] flex items-stretch sm:items-center justify-center sm:p-5 animate-[fade_160ms_ease-out]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-chalk flex flex-col w-full max-w-xl h-[100dvh] sm:h-auto sm:max-h-[94vh] sm:rounded-[14px] sm:border sm:border-border-strong sm:shadow-elev-3 overflow-hidden">
        <div className="flex items-start gap-3 px-5 py-3.5 border-b border-border bg-parchment">
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
              Conversation
            </div>
            <div className="font-display text-xl font-semibold text-walnut tracking-[-0.01em] leading-tight mt-0.5">
              {invitation.speakerName}
            </div>
          </div>
          <InvitationLinkActions
            wardId={wardId}
            invitationId={invitationId}
            invitation={invitation}
          />
          <button
            onClick={onClose}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-walnut-3 hover:text-walnut px-2 py-1 transition-colors"
            aria-label="Close"
          >
            Close
          </button>
        </div>
        <BishopInvitationChat
          wardId={wardId}
          invitationId={invitationId}
          invitation={invitation}
          speaker={speaker}
          date={date}
          speakerId={speakerId}
        />
      </div>
    </div>
  );
}
