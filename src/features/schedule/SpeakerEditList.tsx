import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createSpeaker, deleteSpeaker, updateSpeaker } from "@/features/speakers/speakerActions";
import { useSpeakers } from "@/hooks/useMeeting";
import type { NonMeetingSunday } from "@/lib/types";
import { AddSpeakerCard } from "./AddSpeakerCard";
import { SpeakerEditCard } from "./SpeakerEditCard";
import { emptyDraft, fromSpeaker, isDirty, syncStatusFromLive, type Draft } from "./speakerDraft";

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
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const originalsRef = useRef<Map<string, Draft>>(new Map());
  const seededRef = useRef(false);

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
        // Speaker mutations each internally call writeMeetingPatch to
        // recompute the meeting content hash, so run them serially — parallel
        // saves would each read a stale speakers snapshot and the final
        // hash would not reflect the final speaker set.
        for (const id of deletedIds) {
          await deleteSpeaker(wardId, date, id);
        }
        let plannedCount = 0;
        // Build the post-save draft list as we go so that going back
        // to step 1 (which keeps SpeakerEditList mounted) sees freshly
        // created speakers as already-persisted. Without this, the
        // draft retains `id: null` and a second Save fires another
        // createSpeaker — duplicating the row.
        const nextDrafts: Draft[] = [];
        for (const d of drafts) {
          const name = d.name.trim();
          if (!name) {
            nextDrafts.push(d);
            continue;
          }
          if (d.status === "planned") plannedCount += 1;
          if (d.id === null) {
            const newId = await createSpeaker({
              wardId,
              date,
              nonMeetingSundays,
              name,
              email: d.email.trim() || undefined,
              phone: d.phone.trim() || undefined,
              topic: d.topic.trim() || undefined,
              role: d.role,
            });
            const persisted: Draft = { ...d, id: newId };
            originalsRef.current.set(d.tempId, { ...persisted });
            nextDrafts.push(persisted);
          } else {
            const original = originalsRef.current.get(d.tempId) ?? null;
            if (!isDirty(d, original)) {
              nextDrafts.push(d);
              continue;
            }
            await updateSpeaker(wardId, date, d.id, {
              name,
              email: d.email.trim(),
              phone: d.phone.trim(),
              topic: d.topic.trim(),
              role: d.role,
              status: d.status,
            });
            originalsRef.current.set(d.tempId, { ...d });
            nextDrafts.push(d);
          }
        }
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
        Add or edit speakers for this Sunday. Save when you're ready, then we'll walk through
        sending each invitation in the next step.
      </p>
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-2.5 lg:gap-3.5">
        {drafts.map((d, i) => (
          <SpeakerEditCard
            key={d.tempId}
            draft={d}
            index={i}
            onChange={(partial) => updateDraft(d.tempId, partial)}
            onRemove={() => removeDraft(d.tempId)}
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
