import { useSearchParams } from "react-router";
import { useLatestInvitation } from "@/features/invitations/useLatestInvitation";
import type { WithId } from "@/hooks/_sub";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { Speaker } from "@/lib/types";
import { SpeakerEditCard } from "./SpeakerEditCard";
import { fromSpeaker } from "./speakerDraft";

interface Props {
  date: string;
  /** Speakers piped down from SundayCard's existing live subscription.
   *  Passing them in (rather than re-subscribing here) avoids a
   *  loading-state flicker on the Edit → Invite transition — the
   *  parent already has fresh post-save data ready. */
  speakers: readonly WithId<Speaker>[];
  /** Called by the "open conversation" button on non-planned cards.
   *  Closes the Assign modal so the per-speaker chat dialog renders
   *  on top of the clean schedule view. */
  onClose: () => void;
}

const noop = () => {};

/** Step 2 of the Assign Speakers modal. Reuses <SpeakerEditCard> in
 *  its read-only/locked mode so the modal dimensions stay identical
 *  to step 1 — only the remove button drops out, and the band above
 *  the detail fields swaps between "Prepare invitation" (planned) and
 *  "Already X — open conversation" (non-planned). Declined speakers
 *  are hidden — they have a different re-invite flow. */
export function SpeakerInvitationLauncher({ date, speakers, onClose }: Props) {
  const rows = speakers.filter((s) => s.data.status !== "declined");

  if (rows.length === 0) {
    return (
      <p className="font-serif italic text-[14px] text-walnut-3">
        No speakers yet. Head back to step 1 to add some.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif text-[13.5px] text-walnut-2">
        Send each invitation, then come back here to check replies and apply responses. Opens a
        conversation thread per speaker.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3.5">
        {rows.map((s, i) => (
          <LauncherRow key={s.id} speaker={s} date={date} index={i} onClose={onClose} />
        ))}
      </div>
    </div>
  );
}

interface LauncherRowProps {
  speaker: WithId<Speaker>;
  date: string;
  index: number;
  onClose: () => void;
}

/** One speaker card in Step 2. Subscribes to the speaker's latest
 *  invitation so the non-planned "open conversation" button knows
 *  which chat to route to — SpeakerRow on the schedule auto-opens
 *  its dialog when `?chat=<invitationId>` matches. */
function LauncherRow({ speaker, date, index, onClose }: LauncherRowProps): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const latest = useLatestInvitation(wardId, date, speaker.id);
  const invitationId = latest.invitation?.invitationId ?? null;
  const [, setSearchParams] = useSearchParams();

  const draft = fromSpeaker(speaker.id, {
    name: speaker.data.name,
    email: speaker.data.email,
    phone: speaker.data.phone,
    topic: speaker.data.topic,
    status: speaker.data.status,
    role: speaker.data.role,
  });

  function onOpenChat(id: string | null) {
    onClose();
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("chat", id);
        else next.set("chatSpeaker", speaker.id);
        return next;
      },
      { replace: true },
    );
  }

  return (
    <SpeakerEditCard
      draft={draft}
      index={index}
      onChange={noop}
      onRemove={noop}
      locked={{ date, invitationId, onOpenChat }}
    />
  );
}
