import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { createSpeaker, deleteSpeaker, updateSpeaker } from "@/features/speakers/speakerActions";
import { useSpeakers } from "@/hooks/useMeeting";
import type { NonMeetingSunday } from "@/lib/types";
import { SpeakerEditCard } from "./SpeakerEditCard";
import { emptyDraft, fromSpeaker, isDirty, type Draft } from "./speakerDraft";

interface Props {
  date: string;
  wardId: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export interface SpeakerEditListHandle {
  save: () => Promise<void>;
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
    if (seededRef.current || speakers.loading) return;
    const seeded = speakers.data.map((s) =>
      fromSpeaker(s.id, {
        name: s.data.name,
        email: s.data.email,
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
    setDrafts((prev) => [...prev, emptyDraft()]);
  }

  useImperativeHandle(ref, () => ({
    async save() {
      const tasks: Promise<void>[] = [];
      // Persisted deletions first so any re-indexing/hash recompute settles
      // before we issue create/update for the remaining rows.
      for (const id of deletedIds) {
        tasks.push(deleteSpeaker(wardId, date, id));
      }
      for (const d of drafts) {
        const name = d.name.trim();
        if (!name) continue;
        if (d.id === null) {
          tasks.push(
            createSpeaker({
              wardId,
              date,
              nonMeetingSundays,
              name,
              email: d.email.trim() || undefined,
              topic: d.topic.trim() || undefined,
              role: d.role,
            }),
          );
        } else {
          const original = originalsRef.current.get(d.tempId) ?? null;
          if (!isDirty(d, original)) continue;
          tasks.push(
            updateSpeaker(wardId, date, d.id, {
              name,
              email: d.email.trim(),
              topic: d.topic.trim(),
              role: d.role,
              status: d.status,
            }),
          );
        }
      }
      await Promise.all(tasks);
      setDeletedIds([]);
    },
  }), [drafts, deletedIds, wardId, date, nonMeetingSundays]);

  if (speakers.loading && !seededRef.current) {
    return <p className="text-sm text-walnut-2">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-2.5">
      {drafts.map((d, i) => (
        <SpeakerEditCard
          key={d.tempId}
          draft={d}
          index={i}
          date={date}
          onChange={(partial) => updateDraft(d.tempId, partial)}
          onRemove={() => removeDraft(d.tempId)}
        />
      ))}
      <button
        onClick={addDraft}
        className="self-start font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 inline-flex items-center gap-1.5 transition-colors mt-1"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
        Add speaker
      </button>
    </div>
  );
});
