import { useState } from "react";
import { useParams } from "react-router";
import {
  AssignSlotForm,
  type AssignAction,
  type AssignSeed,
} from "@/features/assign-slot/AssignSlotForm";
import { AssignSlotHeader } from "@/features/assign-slot/AssignSlotHeader";
import { persistAssignPrayer } from "@/features/assign-slot/utils/persistAssignPrayer";
import { usePrayerPlanRow } from "@/features/prayers/hooks/usePrayerPlanRow";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useNavigate } from "@/lib/nav";
import type { PrayerRole } from "@/lib/types";
import { formatShortSunday } from "@/features/schedule/utils/dateFormat";

const ROLE_TITLE: Record<PrayerRole, string> = {
  opening: "Opening prayer",
  benediction: "Closing prayer",
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
  const prayer = usePrayerPlanRow(date ?? "", role ?? "opening");
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!wardId || !date || !role) return null;
  if (prayer.loading) {
    return (
      <main className="min-h-dvh bg-parchment">
        <p className="font-serif italic text-[14px] text-walnut-3 p-4">Loading prayer slot…</p>
      </main>
    );
  }

  const seed: AssignSeed = {
    kind: "prayer",
    name: prayer.name,
    email: prayer.email,
    phone: prayer.phone,
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

  return (
    <main className="min-h-dvh bg-parchment flex flex-col">
      <AssignSlotHeader
        eyebrow={`Assign ${role === "opening" ? "opening prayer" : "closing prayer"}`}
        title={prayer.name.trim() ? prayer.name : ROLE_TITLE[role]}
        subtitle={date ? formatShortSunday(date) : undefined}
      />
      <AssignSlotForm seed={seed} busy={busy} error={error} onSubmit={onSubmit} />
    </main>
  );
}
