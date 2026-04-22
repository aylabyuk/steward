import { useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { PrepareInvitationDialog } from "@/features/templates/PrepareInvitationDialog";
import type { Draft } from "./speakerDraft";
import { InviteActionBtn } from "./SpeakerInviteActionBtn";
import { MailIcon, SendIcon } from "./SpeakerInviteIcons";

interface Props {
  draft: Draft;
  date: string;
  onMarkInvited: () => void;
  onPrint: () => void;
}

/**
 * The single "Prepare invitation" action on the Planned-status strip.
 * Clicking opens `PrepareInvitationDialog`, which owns the letter +
 * email editors and the three finalize actions (Mark invited / Print /
 * Send email). The dialog calls back here for status flips and
 * printing, so the parent card doesn't need to know about it.
 */
export function InviteAction({ draft, date, onMarkInvited, onPrint }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const email = draft.email.trim();
  const hasEmail = email.length > 0;
  const persisted = draft.id !== null;
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-parchment-2 border border-border rounded-lg px-3 py-2.5 mb-3 flex flex-col gap-2">
      <div className="flex items-center flex-wrap gap-y-2.5 gap-x-3.5">
        <div className="flex items-center gap-2 text-[13px] text-walnut-2 min-w-0 flex-1 basis-50 font-serif italic">
          <MailIcon />
          {hasEmail ? (
            <span className="truncate">
              Invitation email ready for{" "}
              <strong className="font-semibold not-italic text-bordeaux font-sans">{email}</strong>
            </span>
          ) : (
            <span>No email on file — print a letter or mark invited directly.</span>
          )}
        </div>
        <div className="inline-flex gap-1.5 shrink-0 ml-auto">
          <InviteActionBtn
            onClick={() => setOpen(true)}
            icon={<SendIcon />}
            primary
            disabled={!persisted || !wardId}
          >
            Prepare invitation
          </InviteActionBtn>
        </div>
      </div>
      {!persisted && hasEmail && (
        <p className="font-sans text-[11.5px] text-walnut-3">
          Save the speaker first — we generate a personal invitation link tied to this row.
        </p>
      )}
      {persisted && wardId && draft.id && (
        <PrepareInvitationDialog
          wardId={wardId}
          date={date}
          speakerId={draft.id}
          speakerName={draft.name}
          speakerEmail={draft.email}
          speakerTopic={draft.topic}
          inviterName={inviterName}
          open={open}
          onClose={() => setOpen(false)}
          onMarkInvited={onMarkInvited}
          onPrint={onPrint}
        />
      )}
    </div>
  );
}
