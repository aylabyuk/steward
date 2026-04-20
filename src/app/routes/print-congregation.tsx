import { Navigate, useParams } from "react-router";
import { CongregationView } from "@/features/print/CongregationView";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function PrintCongregationPage() {
  const { date } = useParams<{ date: string }>();
  if (!date || !ISO_DATE.test(date)) return <Navigate to="/schedule" replace />;
  return <CongregationView date={date} />;
}
