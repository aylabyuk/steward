import { Navigate, useParams } from "react-router";
import { ConductingView } from "@/features/print/ConductingView";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function PrintConductingPage() {
  const { date } = useParams<{ date: string }>();
  if (!date || !ISO_DATE.test(date)) return <Navigate to="/schedule" replace />;
  return <ConductingView date={date} />;
}
