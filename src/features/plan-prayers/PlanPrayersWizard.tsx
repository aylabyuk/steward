import { useState } from "react";
import { useNavigate } from "react-router";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useWardSettings } from "@/hooks/useWardSettings";
import { formatShortDate } from "@/features/schedule/dateFormat";
import { WizardHeader } from "@/features/plan-speakers/WizardHeader";
import { PrayerInvitationStep } from "./PrayerInvitationStep";
import { PrayerRosterStep } from "./PrayerRosterStep";
import { PrayerSummaryStep } from "./PrayerSummaryStep";
import { usePrayerParticipants } from "./usePrayerParticipants";

export type PrayerWizardStep = "roster" | "invitations" | "summary";

interface Props {
  wardId: string;
  date: string;
}

/** Plan-prayers wizard. 1:1 parity with `PlanSpeakersWizard` —
 *  Roster → Invitations → Summary. The header / footer chrome
 *  (WizardHeader, WizardFooter) is shared with the speaker wizard
 *  since the step keys + layout are identical. */
export function PlanPrayersWizard({ wardId, date }: Props) {
  const navigate = useNavigate();
  const participants = usePrayerParticipants(date);
  const ward = useWardSettings();
  const nonMeetingSundays = ward.data?.settings.nonMeetingSundays ?? [];
  const [step, setStep] = useState<PrayerWizardStep>("roster");
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
          <PrayerRosterStep
            wardId={wardId}
            date={date}
            nonMeetingSundays={nonMeetingSundays}
            onContinue={() => setStep("invitations")}
          />
        )}
        {step === "invitations" && (
          <PrayerInvitationStep
            wardId={wardId}
            date={date}
            participants={participants.data}
            loading={participants.loading}
            onBackToRoster={() => setStep("roster")}
            onDone={() => setStep("summary")}
          />
        )}
        {step === "summary" && (
          <PrayerSummaryStep
            participants={participants.data}
            onBackToSchedule={() => navigate("/schedule")}
          />
        )}
      </div>
    </main>
  );
}
