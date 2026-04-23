import { useEffect } from "react";
import type { SpeakerInvitation } from "@/lib/types";
import { BishopInvitationChat } from "./BishopInvitationChat";
import { InvitationLinkActions } from "./InvitationLinkActions";

interface Props {
  open: boolean;
  onClose: () => void;
  wardId: string;
  invitationId: string;
  invitation: SpeakerInvitation;
}

/** Nested modal that hosts the bishop-side chat pane from inside the
 *  Assign Speakers modal. Renders at `z-[60]` (above the Assign
 *  modal's `z-50`), and closes on Escape or backdrop click. Uses the
 *  TwilioChatProvider established higher up the tree. */
export function BishopInvitationDialog({
  open,
  onClose,
  wardId,
  invitationId,
  invitation,
}: Props): React.ReactElement | null {
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
      <div className="bg-chalk border border-border-strong shadow-elev-3 overflow-hidden flex flex-col w-full max-w-xl sm:rounded-[14px] max-h-[94vh]">
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
        <div className="flex-1 overflow-y-auto">
          <BishopInvitationChat
            wardId={wardId}
            invitationId={invitationId}
            invitation={invitation}
          />
        </div>
      </div>
    </div>
  );
}
