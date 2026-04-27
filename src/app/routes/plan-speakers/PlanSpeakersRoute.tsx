import { useParams } from "react-router";
import { PlanSpeakersWizard } from "@/features/plan-speakers/PlanSpeakersWizard";
import { useCurrentWardStore } from "@/stores/currentWardStore";

export function PlanSpeakersRoute() {
  const { date } = useParams<{ date: string }>();
  const wardId = useCurrentWardStore((s) => s.wardId);
  if (!date || !wardId) {
    return (
      <main className="min-h-dvh grid place-items-center bg-parchment p-8">
        <p className="font-serif italic text-walnut-2">Missing context — return to the schedule.</p>
      </main>
    );
  }
  return <PlanSpeakersWizard wardId={wardId} date={date} />;
}
