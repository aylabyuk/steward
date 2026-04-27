import { toE164 } from "@/features/templates/smsInvitation";
import type { usePrayerPlanRow } from "./usePrayerPlanRow";
import { PrayerPlanField } from "./PrayerPlanField";
import { validatePrayerRow } from "./validatePrayerRow";

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
  const { emailError, phoneError } = validatePrayerRow(row);
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
          inputMode="email"
          autoComplete="email"
          placeholder="reyes@example.com"
          invalid={emailError}
          hint={emailError ? "Enter a valid email address (e.g. name@example.com)." : undefined}
        />
        <PrayerPlanField
          label="Phone"
          value={row.phone}
          onChange={row.setPhone}
          onBlur={() => row.setPhone(toE164(row.phone))}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+1 555 123 4567"
          invalid={phoneError}
          hint={
            phoneError
              ? "Use international format: + then country code and digits, e.g. +14165551234."
              : undefined
          }
        />
      </div>
    </li>
  );
}
