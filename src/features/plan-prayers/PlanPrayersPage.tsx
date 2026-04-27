import { Link } from "react-router";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { formatAssignedDate } from "@/features/templates/letterDates";
import { PrayerPlanCard } from "./PrayerPlanCard";

interface Props {
  date: string;
}

/** Plan-prayers full-page surface, launched from the schedule's
 *  Sunday card alongside "Plan speakers". Two stacked cards (Opening,
 *  Benediction). Each card owns its own form state + Send / Mark
 *  invited / Customise-letter actions. */
export function PlanPrayersPage({ date }: Props) {
  useFullViewportLayout();
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";

  return (
    <main className="min-h-dvh bg-parchment flex flex-col">
      <header className="shrink-0 border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to="/schedule"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
          >
            ← Schedule
          </Link>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
            Plan prayers · {formatAssignedDate(date)}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.close()}
          className="shrink-0 rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut-2 hover:bg-parchment-2"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-6 flex flex-col gap-5">
          <p className="font-serif italic text-[14px] text-walnut-2">
            Invite the opening prayer-giver and the benediction (closing prayer) for this Sunday.
            Sending an invitation opens an in-app chat thread and emails / texts the prayer-giver
            with a link to the letter.
          </p>
          <PrayerPlanCard wardId={wardId} date={date} role="opening" />
          <PrayerPlanCard wardId={wardId} date={date} role="benediction" />
        </div>
      </div>
    </main>
  );
}
