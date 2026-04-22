import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Draft } from "./speakerDraft";
import { InviteActionBtn } from "./SpeakerInviteActionBtn";
import { MailIcon, SendIcon } from "./SpeakerInviteIcons";

interface Props {
  draft: Draft;
  date: string;
}

/**
 * Single "Prepare invitation" action on the Planned-status strip.
 * Clicking opens `/week/:date/speaker/:id/prepare` in a new tab so
 * the bishop has the whole viewport for the letter editor + preview.
 * The prepare page handles status flips and sends directly against
 * Firestore — no parent callbacks needed.
 */
export function InviteAction({ draft, date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const email = draft.email.trim();
  const hasEmail = email.length > 0;
  const persisted = draft.id !== null;
  const canOpen = persisted && Boolean(wardId);

  function handleOpen() {
    if (!canOpen || !wardId || !draft.id) return;
    const url = `/week/${encodeURIComponent(date)}/speaker/${encodeURIComponent(draft.id)}/prepare`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

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
            <span>No email on file — print a letter or mark invited in the editor.</span>
          )}
        </div>
        <div className="inline-flex gap-1.5 shrink-0 ml-auto">
          <InviteActionBtn onClick={handleOpen} icon={<SendIcon />} primary disabled={!canOpen}>
            Prepare invitation
          </InviteActionBtn>
        </div>
      </div>
      {!persisted && hasEmail && (
        <p className="font-sans text-[11.5px] text-walnut-3">
          Save the speaker first — we generate a personal invitation link tied to this row.
        </p>
      )}
    </div>
  );
}
