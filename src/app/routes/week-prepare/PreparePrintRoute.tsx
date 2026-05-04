import { Navigate, useParams } from "react-router";
import { PreparePrintView } from "@/features/print/PreparePrintView";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function PreparePrintRoute() {
  const { date } = useParams<{ date: string }>();
  if (!date || !ISO_DATE.test(date)) {
    return <Navigate to="/schedule" replace />;
  }
  return <PreparePrintView date={date} />;
}
