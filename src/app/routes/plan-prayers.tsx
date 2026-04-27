import { Navigate, useParams } from "react-router";
import { PlanPrayersPage } from "@/features/plan-prayers/PlanPrayersPage";

/** Route entry for `/plan/:date/prayers`. Validates the date param
 *  and bounces back to the schedule when missing. */
export function PlanPrayersRoute() {
  const { date } = useParams<{ date: string }>();
  if (!date) return <Navigate to="/schedule" replace />;
  return <PlanPrayersPage date={date} />;
}
