import { useState } from "react";
import { useParams } from "react-router";
import {
  AssignSlotForm,
  type AssignAction,
  type AssignSeed,
} from "@/features/assign-slot/AssignSlotForm";
import { AssignSlotHeader } from "@/features/assign-slot/AssignSlotHeader";
import { persistAssignPrayer } from "@/features/assign-slot/utils/persistAssignPrayer";
import {
  clearPrayerParticipant,
  upsertPrayerParticipant,
} from "@/features/prayers/utils/prayerActions";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { useMeeting } from "@/hooks/useMeeting";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useNavigate } from "@/lib/nav";
import type { PrayerRole, SpeakerStatus } from "@/lib/types";
import { formatShortSunday } from "@/features/schedule/utils/dateFormat";

const ROLE_TITLE: Record<PrayerRole, string> = {
  opening: "Opening Prayer",
  benediction: "Closing Prayer",
};

/** Per-row Assign + Invite page for a prayer slot. Route:
 *  - `/week/:date/prayer/:role/assign` — works for both first
 *    assignment + edit (the participant doc is upserted, mirrored
 *    onto the inline meeting assignment row in the same batch).
 *  Save and Continue lands on the Prepare Prayer Invitation page;
 *  Save as Planned returns to the schedule. */
export function AssignPrayerPage() {
  const { date, role } = useParams<{ date: string; role: PrayerRole }>();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  // Read snapshot data directly rather than via `usePrayerPlanRow` —
  // that hook keeps a latched local form state seeded once via an
  // effect, which fires AFTER the render where loading flips to
  // false. AssignSlotForm initializes its own draft from `seed` on
  // mount, so reading through the hook left the form blank on first
  // paint even when the participant doc was already present.
  const meeting = useMeeting(date ?? null);
  const participant = usePrayerParticipant(date ?? null, role ?? "opening");
  const members = useWardMembers();
  const currentUserUid = useAuthStore((s) => s.user?.uid);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!wardId || !date || !role) return null;
  if (meeting.loading || participant.loading) {
    return (
      <main className="min-h-dvh bg-parchment">
        <p className="font-serif italic text-[14px] text-walnut-3 p-4">Loading prayer slot…</p>
      </main>
    );
  }

  const inlineAssignment =
    role === "opening" ? meeting.data?.openingPrayer : meeting.data?.benediction;
  const seedName = participant.data?.name ?? inlineAssignment?.person?.name ?? "";
  const seedEmail = participant.data?.email ?? "";
  const seedPhone = participant.data?.phone ?? "";
  const seedStatus = participant.data?.status ?? "planned";

  const seed: AssignSeed = {
    kind: "prayer",
    name: seedName,
    email: seedEmail,
    phone: seedPhone,
    status: seedStatus,
  };

  async function onSubmit(action: AssignAction, draft: AssignSeed) {
    if (draft.kind !== "prayer") return;
    setBusy(true);
    setError(null);
    try {
      await persistAssignPrayer({
        wardId: wardId!,
        date: date!,
        role: role!,
        nonMeetingSundays: ward.data?.settings.nonMeetingSundays ?? [],
        name: draft.name,
        email: draft.email,
        phone: draft.phone,
      });
      if (action === "save-and-continue") {
        navigate(`/week/${date}/prayer/${role}/prepare`, { replace: true });
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
    setDeleting(true);
    setError(null);
    try {
      await clearPrayerParticipant(wardId!, date!, role!);
      navigate("/schedule");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setDeleting(false);
    }
  }

  async function onStatusChange(next: SpeakerStatus) {
    setError(null);
    try {
      await upsertPrayerParticipant(wardId!, date!, role!, {
        status: next,
        nonMeetingSundays: ward.data?.settings.nonMeetingSundays ?? [],
      });
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const hasExistingPrayer = Boolean(participant.data) || seedName.trim().length > 0;

  return (
    <main className="min-h-dvh bg-parchment flex flex-col">
      <AssignSlotHeader
        eyebrow={`Assign ${role === "opening" ? "opening prayer" : "closing prayer"}`}
        title={seedName.trim() ? seedName : ROLE_TITLE[role]}
        subtitle={date ? formatShortSunday(date) : undefined}
      />
      <AssignSlotForm
        seed={seed}
        busy={busy}
        error={error}
        onSubmit={onSubmit}
        {...(hasExistingPrayer
          ? {
              onDelete,
              deleting,
              onStatusChange,
              members,
              currentUserUid,
              ...(participant.data?.statusSource
                ? { currentStatusSource: participant.data.statusSource }
                : {}),
              ...(participant.data?.statusSetBy
                ? { currentStatusSetBy: participant.data.statusSetBy }
                : {}),
            }
          : {})}
      />
    </main>
  );
}
