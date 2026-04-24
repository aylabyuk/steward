import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { BishopInvitationDialog } from "@/features/invitations/BishopInvitationDialog";
import { useConversationUnread } from "@/features/invitations/useConversationUnread";
import { useLatestInvitation } from "@/features/invitations/useLatestInvitation";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Speaker, SpeakerStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

interface Props {
  number: number;
  speaker: Speaker;
  /** Firestore doc id of the speaker — needed to look up their most
   *  recent invitation for the chat launcher. */
  speakerId: string;
  /** Meeting date (ISO YYYY-MM-DD). Scopes the invitation lookup. */
  date: string;
}

const STATE_CLS: Record<SpeakerStatus, string> = {
  planned: "bg-parchment-2 text-walnut-2 border-border",
  invited: "bg-brass-soft/40 text-brass-deep border-brass-soft",
  confirmed: "bg-success-soft text-success border-success-soft",
  declined: "bg-danger-soft text-bordeaux border-danger-soft",
};

export function SpeakerRow({ number, speaker, speakerId, date }: Props) {
  const status = speaker.status ?? "planned";
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  const [open, setOpen] = useState(false);
  const latest = useLatestInvitation(wardId || null, date, speakerId);
  const invitation = latest.invitation;
  const response = invitation?.response;
  const needsApply = Boolean(response && !response.acknowledgedAt);
  const unreadCount = useConversationUnread(invitation?.conversationSid);
  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;

  // Auto-open the dialog when something hands us a URL hint:
  //   `?chat=<invitationId>`      — push-notification deep link
  //   `?chatSpeaker=<speakerId>`  — Assign modal's "open conversation"
  //                                  button (may have no invitation yet)
  // Each row checks independently — only the matching one opens +
  // clears the query. Invitation-keyed match waits for the invitation
  // subscription to resolve; speakerId-keyed match is available
  // immediately.
  const [searchParams, setSearchParams] = useSearchParams();
  useEffect(() => {
    const chatKey = searchParams.get("chat");
    const speakerKey = searchParams.get("chatSpeaker");
    const invitationMatches = invitation && chatKey === invitation.invitationId;
    const speakerMatches = speakerKey === speakerId;
    if (!invitationMatches && !speakerMatches) return;
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    if (invitationMatches) next.delete("chat");
    if (speakerMatches) next.delete("chatSpeaker");
    setSearchParams(next, { replace: true });
  }, [invitation, speakerId, searchParams, setSearchParams]);

  return (
    <li className="flex items-center gap-3 py-3 border-b border-border last:border-b-0">
      <div className="font-mono text-[10.5px] tracking-[0.08em] text-brass-deep w-6">
        {String(number).padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-sans text-sm font-semibold text-walnut truncate">{speaker.name}</div>
        {speaker.topic && (
          <div className="font-serif italic text-sm text-walnut-2 truncate">{speaker.topic}</div>
        )}
      </div>
      <div
        className={cn(
          "font-mono text-[9.5px] uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-full border whitespace-nowrap",
          STATE_CLS[status],
        )}
      >
        {status}
      </div>
      <ChatIconButton
        badge={needsApply || hasUnread}
        onClick={() => setOpen(true)}
        speakerName={speaker.name}
      />
      <BishopInvitationDialog
        open={open}
        onClose={() => setOpen(false)}
        wardId={wardId}
        invitationId={invitation?.invitationId ?? null}
        invitation={invitation ?? null}
        speaker={speaker}
        date={date}
        speakerId={speakerId}
      />
    </li>
  );
}

interface ChatIconButtonProps {
  badge: boolean;
  onClick: () => void;
  speakerName: string;
}

function ChatIconButton({ badge, onClick, speakerName }: ChatIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open conversation with ${speakerName}`}
      title="Open conversation"
      className="relative inline-flex items-center justify-center w-8 h-8 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 hover:border-bordeaux transition-colors"
    >
      <ChatIcon />
      {badge && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-bordeaux border border-chalk"
        />
      )}
    </button>
  );
}

function ChatIcon() {
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
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
