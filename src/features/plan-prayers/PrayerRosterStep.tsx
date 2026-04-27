import { useState } from "react";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { upsertPrayerParticipant } from "@/features/prayers/prayerActions";
import { WizardFooter } from "@/features/plan-speakers/WizardFooter";
import type { NonMeetingSunday } from "@/lib/types";
import { PrayerRosterRow } from "./PrayerRosterRow";
import { usePrayerPlanRow } from "./usePrayerPlanRow";
import { validatePrayerRow } from "./validatePrayerRow";

interface Props {
  wardId: string;
  date: string;
  nonMeetingSundays: readonly NonMeetingSunday[];
  onContinue: () => void;
}

/** Step 1 of the Plan-prayers wizard. Mirrors `RosterStep` for
 *  speakers but with a fixed 2-slot shape (Opening + Benediction).
 *  Persists name + contact onto the prayer participant docs at
 *  `meetings/{date}/prayers/{role}` before advancing. */
export function PrayerRosterStep({ wardId, date, nonMeetingSundays, onContinue }: Props) {
  const opening = usePrayerPlanRow(date, "opening");
  const benediction = usePrayerPlanRow(date, "benediction");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = [
    { role: "opening" as const, row: opening },
    { role: "benediction" as const, row: benediction },
  ];
  const validCount = rows.filter(({ row }) => row.name.trim()).length;
  const hasFieldError = rows.some(({ row }) => validatePrayerRow(row).hasError);
  const canContinue = validCount > 0 && !hasFieldError && !saving;

  async function handleContinue() {
    setError(null);
    setSaving(true);
    try {
      for (const { role, row } of rows) {
        if (!row.name.trim()) continue;
        await upsertPrayerParticipant(wardId, date, role, {
          name: row.name.trim(),
          email: row.email.trim(),
          phone: row.phone.trim(),
          nonMeetingSundays,
        });
      }
      onContinue();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5 flex flex-col gap-5">
          <p className="font-serif text-[14.5px] text-walnut-2 leading-relaxed">
            Who will give the opening prayer + benediction? Add their name and (optionally) contact
            details for each. We'll figure out invitations on the next step.
          </p>

          <ul className="flex flex-col gap-3 list-none p-0 m-0">
            <PrayerRosterRow
              row={opening}
              label="Opening prayer"
              autocompleteSection="prayer-opening"
            />
            <PrayerRosterRow
              row={benediction}
              label="Benediction"
              autocompleteSection="prayer-benediction"
            />
          </ul>

          {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
        </div>
      </div>

      <WizardFooter align="end">
        <button
          type="button"
          onClick={() => void handleContinue()}
          disabled={!canContinue}
          className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving…" : "Continue →"}
        </button>
      </WizardFooter>
    </div>
  );
}
