import { useEffect, useRef, useState } from "react";
import { useSpeakers } from "@/hooks/useMeeting";
import type { NonMeetingSunday } from "@/lib/types";
import { deleteSpeaker } from "@/features/speakers/speakerActions";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { emptyDraft, fromSpeaker, type RosterDraft } from "./rosterDraft";
import { persistRoster } from "./persistRoster";
import { RosterRow } from "./RosterRow";
import { WizardFooter } from "./WizardFooter";

const MAX_SPEAKERS = 4;

interface Props {
  wardId: string;
  date: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  onContinue: () => void;
}

export function RosterStep({ wardId, date, nonMeetingSundays, onContinue }: Props) {
  const speakers = useSpeakers(date);
  const [drafts, setDrafts] = useState<RosterDraft[]>([]);
  const originalsRef = useRef<Map<string, RosterDraft>>(new Map());
  const seededRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seededRef.current || speakers.loading) return;
    const seeded = speakers.data.map((s) =>
      fromSpeaker(s.id, {
        name: s.data.name,
        topic: s.data.topic,
        role: s.data.role,
        status: s.data.status,
        email: s.data.email,
        phone: s.data.phone,
      }),
    );
    if (seeded.length === 0) seeded.push(emptyDraft());
    const originals = new Map<string, RosterDraft>();
    seeded.forEach((d) => originals.set(d.tempId, { ...d }));
    originalsRef.current = originals;
    setDrafts(seeded);
    seededRef.current = true;
  }, [speakers.loading, speakers.data]);

  function update(tempId: string, patch: Partial<RosterDraft>) {
    setDrafts((prev) => prev.map((d) => (d.tempId === tempId ? { ...d, ...patch } : d)));
  }

  async function remove(tempId: string) {
    setError(null);
    const target = drafts.find((d) => d.tempId === tempId);
    if (!target) return;
    if (target.id) {
      try {
        await deleteSpeaker(wardId, date, target.id);
      } catch (e) {
        setError(friendlyWriteError(e));
        throw e;
      }
    }
    originalsRef.current.delete(tempId);
    setDrafts((prev) => prev.filter((d) => d.tempId !== tempId));
  }

  function add() {
    setDrafts((prev) => (prev.length >= MAX_SPEAKERS ? prev : [...prev, emptyDraft()]));
  }

  async function handleContinue() {
    setError(null);
    setSaving(true);
    try {
      await persistRoster({
        wardId,
        date,
        nonMeetingSundays,
        drafts,
        originals: originalsRef.current,
        deletedIds: [],
      });
      onContinue();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  const validCount = drafts.filter((d) => d.name.trim()).length;
  const canContinue = validCount > 0 && !saving;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5 flex flex-col gap-5">
          <p className="font-serif text-[14.5px] text-walnut-2 leading-relaxed">
            Who's speaking on this Sunday? Add a name and (optionally) a topic for each speaker.
            We'll figure out invitations on the next step.
          </p>

          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            {drafts.map((d, i) => (
              <RosterRow
                key={d.tempId}
                draft={d}
                index={i}
                onChange={(patch) => update(d.tempId, patch)}
                onConfirmedRemove={() => remove(d.tempId)}
              />
            ))}
          </ul>

          {drafts.length < MAX_SPEAKERS && (
            <button
              type="button"
              onClick={add}
              className="self-start text-[13px] font-sans font-semibold text-bordeaux hover:text-bordeaux-deep py-1.5"
            >
              + Add another speaker
            </button>
          )}

          {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
        </div>
      </div>

      <WizardFooter align="end">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Continue →"}
        </button>
      </WizardFooter>
    </div>
  );
}
