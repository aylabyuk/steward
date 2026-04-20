import { Navigate, useParams } from "react-router";
import { WeekEditor } from "@/features/meetings/WeekEditor";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function Week() {
  const { date } = useParams<{ date: string }>();
  if (!date || !ISO_DATE.test(date)) {
    return <Navigate to="/schedule" replace />;
  }
  return <WeekEditor date={date} />;
}
