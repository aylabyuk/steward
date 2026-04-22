import type { WithId } from "@/hooks/_sub";
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
}

const noop = () => {};

/** Step 2 of the Assign Speakers modal. Reuses <SpeakerEditCard> in
 *  its read-only/locked mode so the modal dimensions stay identical
 *  to step 1 — only the status pills and remove button swap out for a
 *  "Prepare invitation" action (planned) or an "already handled"
 *  note (invited / confirmed). Declined speakers are hidden — they
 *  have a different re-invite flow. */
export function SpeakerInvitationLauncher({ date, speakers }: Props) {
  const rows = speakers.filter((s) => s.data.status !== "declined");

  if (rows.length === 0) {
    return (
      <p className="font-serif italic text-[14px] text-walnut-3">
        No speakers yet. Head back to step 1 to add some.
      </p>
    );
  }

  const drafts = rows.map((s) =>
    fromSpeaker(s.id, {
      name: s.data.name,
      email: s.data.email,
      phone: s.data.phone,
      topic: s.data.topic,
      status: s.data.status,
      role: s.data.role,
    }),
  );

  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif text-[13.5px] text-walnut-2">
        Send each invitation, then come back here to check replies and apply responses. Opens a
        conversation thread per speaker.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3.5">
        {drafts.map((d, i) => (
          <SpeakerEditCard
            key={d.tempId}
            draft={d}
            index={i}
            onChange={noop}
            onRemove={noop}
            locked={{ date }}
          />
        ))}
      </div>
    </div>
  );
}
