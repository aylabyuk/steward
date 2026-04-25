import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { useSpeakers } from "@/hooks/useMeeting";
import type { NonMeetingSunday } from "@/lib/types";
import { AddSpeakerCard } from "./AddSpeakerCard";
import { persistDrafts } from "./persistDrafts";
import { SpeakerEditCard } from "./SpeakerEditCard";
import { emptyDraft, fromSpeaker, syncStatusFromLive, type Draft } from "./speakerDraft";

interface Props {
  date: string;
  wardId: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

/** Typical sacrament meeting has 2–3 speakers; 4 is the rare
 *  all-slots-filled Sunday (e.g. a youth month with two youth + two
 *  adults). Cap the Add button here rather than letting bishoprics
 *  accidentally stack a long list that'll blow the time budget. */
const MAX_SPEAKERS = 4;

export interface SpeakerEditListHandle {
  /** Persist all changes. Resolves with the count of speakers still
   *  in "planned" status after save — the caller uses that to decide
   *  whether to advance to the Invite Launcher (step 2) or close the
   *  modal when there's no one left to invite. */
  save: () => Promise<number>;
}

export const SpeakerEditList = forwardRef<SpeakerEditListHandle, Props>(function SpeakerEditList(
  { date, wardId, nonMeetingSundays },
  ref,
) {
  const speakers = useSpeakers(date);
  const [, setSearchParams] = useSearchParams();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const originalsRef = useRef<Map<string, Draft>>(new Map());
  const seededRef = useRef(false);

  // Routes the "Already X — open conversation" action up to the URL
  // so the schedule's SpeakerRow auto-opens its chat dialog above
  // the Assign modal — same hand-off the prior step-2 launcher
  // used. `chatSpeaker` works for any persisted speaker; the
  // dialog handles the no-invitation-yet case on its own.
  const openChatForSpeaker = useCallback(
    (speakerId: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("chatSpeaker", speakerId);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (speakers.loading) return;
    if (!seededRef.current) {
      const seeded = speakers.data.map((s) =>
        fromSpeaker(s.id, {
          name: s.data.name,
          email: s.data.email,
          phone: s.data.phone,
          topic: s.data.topic,
          status: s.data.status,
          role: s.data.role,
        }),
      );
      const originals = new Map<string, Draft>();
      seeded.forEach((d) => originals.set(d.tempId, { ...d }));
      originalsRef.current = originals;
      setDrafts(seeded);
      seededRef.current = true;
      return;
    }
    // Subsequent server pushes (e.g. step 2 marking a speaker
    // "invited", or the chat-side status switcher flipping to
    // "confirmed") need to flow back into the local draft so
    // step 1 doesn't show a stale "planned" pill.
    setDrafts((prev) => syncStatusFromLive(prev, speakers.data, originalsRef.current));
  }, [speakers.loading, speakers.data]);

  function updateDraft(tempId: string, partial: Partial<Draft>) {
    setDrafts((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, ...partial } : d)));
  }

  function removeDraft(tempId: string) {
    setDrafts((prev) => {
      const target = prev.find((d) => d.tempId === tempId);
      if (target && target.id) {
        // Persisted: queue a Firestore delete to run on Save.
        setDeletedIds((ids) => (ids.includes(target.id!) ? ids : [...ids, target.id!]));
      }
      return prev.filter((d) => d.tempId !== tempId);
    });
  }

  function addDraft() {
    setDrafts((prev) => (prev.length >= MAX_SPEAKERS ? prev : [...prev, emptyDraft()]));
  }

  useImperativeHandle(
    ref,
    () => ({
      async save() {
        const { nextDrafts, plannedCount } = await persistDrafts({
          drafts,
          deletedIds,
          wardId,
          date,
          nonMeetingSundays,
          originals: originalsRef.current,
        });
        setDeletedIds([]);
        setDrafts(nextDrafts);
        return plannedCount;
      },
    }),
    [drafts, deletedIds, wardId, date, nonMeetingSundays],
  );

  if (speakers.loading && !seededRef.current) {
    return <p className="text-sm text-walnut-2">Loading…</p>;
  }

  // When at least one card is past "planned", every sibling card
  // reserves vertical space for the soft-lock caption — keeps the
  // input rows aligned across the grid.
  const anyNonPlanned = drafts.some((d) => d.status !== "planned");

  return (
    <div className="flex flex-col gap-3">
      <p className="font-serif text-[13.5px] text-walnut-2">
        Add or edit speakers for this Sunday. Each card has its own Prepare-invitation and
        open-conversation actions — Save persists name/email/phone/topic/role changes.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3.5">
        {drafts.map((d, i) => (
          <SpeakerEditCard
            key={d.tempId}
            draft={d}
            index={i}
            date={date}
            onChange={(partial) => updateDraft(d.tempId, partial)}
            onRemove={() => removeDraft(d.tempId)}
            {...(d.id ? { onOpenChat: () => openChatForSpeaker(d.id!) } : {})}
            reserveLockSlot={anyNonPlanned}
          />
        ))}
        <AddSpeakerCard
          onClick={addDraft}
          disabled={drafts.length >= MAX_SPEAKERS}
          max={MAX_SPEAKERS}
        />
      </div>
    </div>
  );
});
