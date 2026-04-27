import { useState } from "react";
import { useNavigate } from "react-router";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { formatShortDate } from "@/features/schedule/utils/dateFormat";
import { RosterStep } from "./RosterStep";
import { InvitationStep } from "./InvitationStep";
import { SummaryStep } from "./SummaryStep";
import { WizardHeader } from "./WizardHeader";

export type WizardStep = "roster" | "invitations" | "summary";

interface Props {
  wardId: string;
  date: string;
}

export function PlanSpeakersWizard({ wardId, date }: Props) {
  const navigate = useNavigate();
  const speakers = useSpeakers(date);
  const ward = useWardSettings();
  const nonMeetingSundays = ward.data?.settings.nonMeetingSundays ?? [];
  const [step, setStep] = useState<WizardStep>("roster");
  useFullViewportLayout();

  function back() {
    if (step === "summary") setStep("invitations");
    else if (step === "invitations") setStep("roster");
    else navigate("/schedule");
  }

  return (
    <main className="h-dvh bg-parchment flex flex-col overflow-hidden">
      <WizardHeader
        step={step}
        title={formatShortDate(date)}
        onBack={back}
        onClose={() => navigate("/schedule")}
      />

      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {step === "roster" && (
          <RosterStep
            wardId={wardId}
            date={date}
            nonMeetingSundays={nonMeetingSundays}
            onContinue={() => setStep("invitations")}
          />
        )}
        {step === "invitations" && (
          <InvitationStep
            wardId={wardId}
            date={date}
            speakers={speakers.data}
            loading={speakers.loading}
            onBackToRoster={() => setStep("roster")}
            onDone={() => setStep("summary")}
          />
        )}
        {step === "summary" && (
          <SummaryStep speakers={speakers.data} onBackToSchedule={() => navigate("/schedule")} />
        )}
      </div>
    </main>
  );
}
