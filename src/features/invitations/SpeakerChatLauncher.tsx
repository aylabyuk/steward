import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import type { Speaker } from "@/lib/types";
import { BishopInvitationDialog } from "./BishopInvitationDialog";
import { useConversationUnread } from "./hooks/useConversationUnread";
import { useLatestInvitation } from "./hooks/useLatestInvitation";

interface Props {
  wardId: string;
  date: string;
  speaker: Speaker;
  speakerId: string;
}

/** A speaker-row chat affordance: a small chat icon that opens the
 *  bishop-side invitation/chat dialog for one speaker, with a dot
 *  badge when there's something to attend to (unread reply or an
 *  unacknowledged response). Auto-opens the dialog when a URL hint
 *  arrives — `?chat=<invitationId>` (push-notification deep links)
 *  or `?chatSpeaker=<speakerId>` (the assign modal's "open
 *  conversation" button). Each rendered launcher checks its own
 *  match independently and clears the matching key from the query. */
export function SpeakerChatLauncher({ wardId, date, speaker, speakerId }: Props) {
  const [open, setOpen] = useState(false);
  const latest = useLatestInvitation(wardId || null, date, speakerId);
  const invitation = latest.invitation;
  const response = invitation?.response;
  const needsApply = Boolean(response && !response.acknowledgedAt);
  const unreadCount = useConversationUnread(invitation?.conversationSid);
  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;

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
    <>
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
    </>
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
      aria-hidden="true"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
