import { useMemo, useState } from "react";
import type { PrayerParticipant, PrayerRole, Speaker } from "@/lib/types";
import { BishopInvitationDialog } from "./BishopInvitationDialog";
import { useConversationUnread } from "./useConversationUnread";
import { useLatestInvitation } from "./useLatestInvitation";

interface Props {
  wardId: string;
  date: string;
  role: PrayerRole;
  /** Live participant doc (when present). Read by the launcher to
   *  derive the synthesised Speaker shape the dialog expects. */
  participant: PrayerParticipant | null;
  /** Fallback name from the lightweight inline `meeting.{role}.person`
   *  Assignment row, used when no participant doc has been promoted
   *  yet but the bishop has typed a name in the meeting editor. */
  fallbackName: string;
}

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "Opening prayer",
  benediction: "Benediction",
};

/** Chat-launcher icon for a prayer-giver row, parallel to
 *  `SpeakerChatLauncher`. Reuses the same `BishopInvitationDialog` —
 *  the dialog's `kind="prayer"` branch already routes the no-invitation
 *  placeholder's Prepare CTA to the prayer prepare-invitation route
 *  and routes status writes to the prayer participant doc. */
export function PrayerChatLauncher({ wardId, date, role, participant, fallbackName }: Props) {
  const [open, setOpen] = useState(false);
  const latest = useLatestInvitation(wardId || null, date, role);
  const invitation = latest.invitation;
  const response = invitation?.response;
  const needsApply = Boolean(response && !response.acknowledgedAt);
  const unreadCount = useConversationUnread(invitation?.conversationSid);
  const hasUnread = typeof unreadCount === "number" && unreadCount > 0;

  // The Speaker shape `BishopInvitationDialog` expects — synthesised
  // from the prayer participant doc + inline-row fallback so the
  // status banner + pills render correctly. `topic` stays empty since
  // prayer letters use {{prayerType}} instead.
  const speakerShape = useMemo<Speaker>(
    () => ({
      name: participant?.name ?? fallbackName ?? ROLE_LABEL[role],
      email: participant?.email ?? "",
      phone: participant?.phone ?? "",
      status: participant?.status ?? "planned",
      role: "Member" as const,
      ...(participant?.statusSource ? { statusSource: participant.statusSource } : {}),
      ...(participant?.statusSetBy ? { statusSetBy: participant.statusSetBy } : {}),
      ...(participant?.statusSetAt ? { statusSetAt: participant.statusSetAt } : {}),
    }),
    [participant, fallbackName, role],
  );

  return (
    <>
      <ChatIconButton
        badge={needsApply || hasUnread}
        onClick={() => setOpen(true)}
        label={ROLE_LABEL[role]}
      />
      <BishopInvitationDialog
        open={open}
        onClose={() => setOpen(false)}
        wardId={wardId}
        invitationId={invitation?.invitationId ?? null}
        invitation={invitation ?? null}
        speaker={speakerShape}
        date={date}
        speakerId={role}
        kind="prayer"
      />
    </>
  );
}

interface ChatIconButtonProps {
  badge: boolean;
  onClick: () => void;
  label: string;
}

function ChatIconButton({ badge, onClick, label }: ChatIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open conversation for ${label}`}
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
