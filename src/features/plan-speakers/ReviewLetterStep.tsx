import { useMemo, useState } from "react";
import type { LetterPageStyle, Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useLatestInvitation } from "@/features/invitations/useLatestInvitation";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { usePrepareInvitation } from "@/features/templates/usePrepareInvitation";
import { interpolate } from "@/features/templates/interpolate";
import { formatAssignedDate, formatToday } from "@/features/templates/letterDates";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { resolveChipsInState } from "@/features/page-editor/serializeForInterpolation";
import { PostPrintConfirmStep } from "./PostPrintConfirmStep";
import { ReviewLetterFooter } from "./ReviewLetterFooter";
import { useReviewLetterAction } from "./useReviewLetterAction";
import { useWizardActions } from "./useWizardActions";
import type { ActionMode } from "./SpeakerActionPicker";

interface Props {
  wardId: string;
  date: string;
  speaker: WithId<Speaker>;
  mode: ActionMode;
  onBack: () => void;
  onComplete: () => void;
}

export function ReviewLetterStep({ wardId, date, speaker, mode, onBack, onComplete }: Props) {
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const ward = useWardSettings();
  const { data: letterTemplate } = useSpeakerLetterTemplate();
  const { invitation } = useLatestInvitation(wardId, date, speaker.id);
  const actions = useWizardActions();

  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const wardName = ward.data?.name ?? "";

  // Per-session page-style override. Defaults to the ward template's
  // saved page style so changing here only diverges this session's
  // preview + print — not persisted on the speaker doc. Bishops who
  // want to lock a different size for everyone do that on
  // /settings/templates/speaker-letter.
  const [pageStyle, setPageStyle] = useState<LetterPageStyle | null>(null);
  const effectivePageStyle = pageStyle ?? letterTemplate?.pageStyle ?? null;

  const form = usePrepareInvitation({
    wardId,
    date,
    speakerId: speaker.id,
    open: true,
    letterTemplate,
  });

  const vars = useMemo(
    () => ({
      speakerName: speaker.data.name,
      topic: speaker.data.topic?.trim() || "a topic of your choosing",
      date: formatAssignedDate(date),
      today: formatToday(),
      wardName,
      inviterName,
    }),
    [speaker.data.name, speaker.data.topic, date, wardName, inviterName],
  );

  const { handle, postPrint } = useReviewLetterAction({
    wardId,
    date,
    speaker,
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
        speakerName={speaker.data.name}
        busy={actions.busy}
        onSkip={onComplete}
        onConfirm={async () => {
          const ok = await actions.markInvited({ wardId, date, speakerId: speaker.id });
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
  // Bake the live editor state for the print path: chips resolve to
  // real speaker / ward values, {{token}} strings in chrome props
  // get interpolated. Without this, the OS print dialog falls
  // through to the legacy chrome+markdown render — which can't carry
  // chip color, chip italic, the bishop's authored signatory, or
  // any custom letterhead, and ends up duplicating sections.
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
        <LetterPageEditor
          key={form.resetKey}
          assignedDate={vars.date}
          initialJson={form.initialJson}
          initialMarkdown={form.initialMarkdown}
          {...(effectivePageStyle ? { pageStyle: effectivePageStyle } : {})}
          onPageStyleChange={setPageStyle}
          vars={vars}
          onChange={form.setLetterStateJson}
          onInitial={form.captureInitial}
          ariaLabel={`Letter for ${speaker.data.name}`}
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
