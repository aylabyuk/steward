import { useState } from "react";
import { useParams } from "react-router";
import {
  AssignSlotForm,
  type AssignAction,
  type AssignSeed,
} from "@/features/assign-slot/AssignSlotForm";
import { AssignSlotHeader } from "@/features/assign-slot/AssignSlotHeader";
import { persistAssignSpeaker } from "@/features/assign-slot/utils/persistAssignSpeaker";
import { deleteSpeaker } from "@/features/speakers/utils/speakerActions";
import { useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useNavigate } from "@/lib/nav";
import type { SpeakerRole } from "@/lib/types";
import { formatShortSunday } from "@/features/schedule/utils/dateFormat";

const DEFAULT_ROLE: SpeakerRole = "Member";

/** Per-row Assign + Invite page for a speaker slot. Routes:
 *  - `/week/:date/speaker/new/assign` — create mode
 *  - `/week/:date/speaker/:speakerId/assign` — edit mode
 *  Save and Continue lands on the Prepare Invitation page; Save as
 *  Planned returns to the schedule. Editing an existing speaker
 *  exposes a Delete button (type-to-confirm via DeleteSpeakerConfirm). */
export function AssignSpeakerPage() {
  const { date, speakerId } = useParams<{ date: string; speakerId: string }>();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const speakers = useSpeakers(date ?? null);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isNew = speakerId === "new";
  const existing = isNew ? null : speakers.data?.find((s) => s.id === speakerId);
  const seed: AssignSeed = {
    kind: "speaker",
    speakerId: existing?.id ?? null,
    name: existing?.data.name ?? "",
    topic: existing?.data.topic ?? "",
    role: existing?.data.role ?? DEFAULT_ROLE,
    email: existing?.data.email ?? "",
    phone: existing?.data.phone ?? "",
    status: existing?.data.status ?? "planned",
  };

  if (!wardId || !date || !speakerId) return null;
  if (!isNew && speakers.loading) {
    return (
      <main className="min-h-dvh bg-parchment">
        <p className="font-serif italic text-[14px] text-walnut-3 p-4">Loading speaker…</p>
      </main>
    );
  }
  if (!isNew && !existing) {
    return (
      <main className="min-h-dvh bg-parchment">
        <AssignSlotHeader eyebrow="Assign speaker" title="Speaker not found" subtitle={undefined} />
        <p className="font-serif italic text-[14px] text-walnut-3 p-6">
          This speaker may have been removed. Return to the schedule.
        </p>
      </main>
    );
  }

  async function onSubmit(action: AssignAction, draft: AssignSeed) {
    if (draft.kind !== "speaker") return;
    setBusy(true);
    setError(null);
    try {
      const id = await persistAssignSpeaker({
        wardId: wardId!,
        date: date!,
        speakerId: draft.speakerId,
        nonMeetingSundays: ward.data?.settings.nonMeetingSundays ?? [],
        name: draft.name,
        topic: draft.topic,
        role: draft.role,
        email: draft.email,
        phone: draft.phone,
      });
      if (action === "save-and-continue") {
        navigate(`/week/${date}/speaker/${id}/prepare`, { replace: true });
      } else {
        navigate("/schedule");
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!existing) return;
    setDeleting(true);
    try {
      await deleteSpeaker(wardId!, date!, existing.id);
      navigate("/schedule");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-dvh bg-parchment flex flex-col">
      <AssignSlotHeader
        eyebrow={isNew ? "Assign speaker" : "Edit speaker"}
        title={isNew ? "New speaker" : (existing?.data.name ?? "Speaker")}
        subtitle={date ? formatShortSunday(date) : undefined}
      />
      <AssignSlotForm
        seed={seed}
        busy={busy}
        error={error}
        onSubmit={onSubmit}
        {...(existing ? { onDelete, deleting } : {})}
      />
    </main>
  );
}
