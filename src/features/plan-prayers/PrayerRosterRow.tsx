import type { usePrayerPlanRow } from "./usePrayerPlanRow";
import { PrayerPlanField } from "./PrayerPlanField";

interface Props {
  row: ReturnType<typeof usePrayerPlanRow>;
  label: string;
}

/** Single row in the Plan-prayers roster step. Mirrors `RosterRow`
 *  for speakers (visual rhythm + field shapes) but tailored to the
 *  prayer schema: name + email + phone, no topic / role / status
 *  controls. Persistence happens on Continue (PrayerRosterStep
 *  collects all rows + writes in one pass). */
export function PrayerRosterRow({ row, label }: Props) {
  return (
    <li className="bg-chalk border border-border rounded-lg p-4 sm:p-5 flex flex-col gap-3">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
        {label}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
        <PrayerPlanField
          label="Name"
          value={row.name}
          onChange={row.setName}
          placeholder="Sister Reyes"
        />
        <PrayerPlanField
          label="Email"
          value={row.email}
          onChange={row.setEmail}
          type="email"
          placeholder="reyes@example.com"
        />
        <PrayerPlanField
          label="Phone"
          value={row.phone}
          onChange={row.setPhone}
          type="tel"
          placeholder="+1 555 123 4567"
        />
      </div>
    </li>
  );
}
