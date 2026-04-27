import { Navigate, useParams } from "react-router";
import { PlanPrayersWizard } from "@/features/plan-prayers/PlanPrayersWizard";
import { useCurrentWardStore } from "@/stores/currentWardStore";

/** Route entry for `/plan/:date/prayers`. Validates the date param
 *  and bounces back to the schedule when missing. */
export function PlanPrayersRoute() {
  const { date } = useParams<{ date: string }>();
  const wardId = useCurrentWardStore((s) => s.wardId) ?? "";
  if (!date) return <Navigate to="/schedule" replace />;
  return <PlanPrayersWizard wardId={wardId} date={date} />;
}
