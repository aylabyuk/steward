import { useMemo, useState } from "react";
import type { LetterPageStyle, PrayerParticipant, PrayerRole } from "@/lib/types";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useLatestInvitation } from "@/features/invitations/hooks/useLatestInvitation";
import { usePrayerLetterTemplate } from "@/features/templates/usePrayerLetterTemplate";
import { usePreparePrayerInvitation } from "@/features/prayers/usePreparePrayerInvitation";
import { interpolate } from "@/features/templates/interpolate";
import { formatAssignedDate, formatToday } from "@/features/templates/letterDates";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { resolveChipsInState } from "@/features/page-editor/serializeForInterpolation";
import { ReviewLetterFooter } from "@/features/plan-speakers/ReviewLetterFooter";
import { PostPrintConfirmStep } from "@/features/plan-speakers/PostPrintConfirmStep";
import type { PrayerActionMode } from "./PrayerActionPicker";
import { PrayerLetterReviewBody } from "./PrayerLetterReviewBody";
import { useReviewPrayerLetterAction } from "./useReviewPrayerLetterAction";
import { usePrayerWizardActions } from "./usePrayerWizardActions";

interface Props {
  wardId: string;
  date: string;
  role: PrayerRole;
  participant: PrayerParticipant;
  mode: PrayerActionMode;
  onBack: () => void;
  onComplete: () => void;
}

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "opening prayer",
  benediction: "benediction",
};

export function ReviewPrayerLetterStep({
  wardId,
  date,
  role,
  participant,
  mode,
  onBack,
  onComplete,
}: Props) {
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const ward = useWardSettings();
  const { data: letterTemplate } = usePrayerLetterTemplate();
  const { invitation } = useLatestInvitation(wardId, date, role);
  const actions = usePrayerWizardActions();

  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const wardName = ward.data?.name ?? "";

  const [pageStyle, setPageStyle] = useState<LetterPageStyle | null>(null);
  const effectivePageStyle = pageStyle ?? letterTemplate?.pageStyle ?? null;

  const form = usePreparePrayerInvitation({
    wardId,
    date,
    role,
    open: true,
    letterTemplate,
  });

  const vars = useMemo(
    () => ({
      speakerName: participant.name,
      prayerGiverName: participant.name,
      prayerType: ROLE_LABEL[role],
      date: formatAssignedDate(date),
      today: formatToday(),
      wardName,
      inviterName,
    }),
    [participant.name, role, date, wardName, inviterName],
  );

  const { handle, postPrint } = useReviewPrayerLetterAction({
    wardId,
    date,
    role,
    participant,
    mode,
    inviterName,
    bishopEmail: authUser?.email ?? "",
    invitationId: invitation?.invitationId,
    form,
    actions,
    onComplete,
  });

  if (postPrint) {
    return (
      <PostPrintConfirmStep
        speakerName={participant.name}
        busy={actions.busy}
        onSkip={onComplete}
        onConfirm={async () => {
          const ok = await actions.markInvited({ wardId, date, role });
          if (ok) onComplete();
        }}
      />
    );
  }

  if (!form.hydrated) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-5">
          <p className="font-serif italic text-walnut-2">Loading letter…</p>
        </div>
      </div>
    );
  }

  const renderedBody = interpolate(form.letterBody, vars);
  const renderedFooter = interpolate(form.letterFooter, vars);
  const printEditorStateJson = form.letterStateJson
    ? resolveChipsInState(interpolate(form.letterStateJson, vars), vars)
    : undefined;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PrintOnlyLetter
        wardName={wardName}
        assignedDate={vars.date}
        today={vars.today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
        {...(printEditorStateJson ? { editorStateJson: printEditorStateJson } : {})}
      />
      <div className="flex-1 min-h-0">
        <PrayerLetterReviewBody
          participant={participant}
          wardName={wardName}
          assignedDate={vars.date}
          today={vars.today}
          renderedBody={renderedBody}
          renderedFooter={renderedFooter}
          vars={vars}
          pageStyle={effectivePageStyle}
          onPageStyleChange={setPageStyle}
          form={form}
        />
      </div>
      {(form.error || actions.error) && (
        <p className="shrink-0 px-5 sm:px-8 pb-2 font-sans text-[12.5px] text-bordeaux">
          {form.error ?? actions.error}
        </p>
      )}
      <ReviewLetterFooter mode={mode} busy={actions.busy} onBack={onBack} onPrimary={handle} />
    </div>
  );
}
