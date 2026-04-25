import { useMemo, useState } from "react";
import type { Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useLatestInvitation } from "@/features/invitations/useLatestInvitation";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { usePrepareInvitation } from "@/features/templates/usePrepareInvitation";
import { PrepareInvitationLetterTab } from "@/features/templates/PrepareInvitationLetterTab";
import { formatAssignedDate, formatToday } from "@/features/templates/letterDates";
import { PostPrintConfirmStep } from "./PostPrintConfirmStep";
import { ReviewLetterFooter } from "./ReviewLetterFooter";
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
  const [postPrint, setPostPrint] = useState(false);

  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const wardName = ward.data?.name ?? "";

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

  async function handlePrimary() {
    if (mode === "send") {
      await form.persistOverrides();
      const ok = await actions.sendFresh({
        wardId,
        date,
        speakerId: speaker.id,
        speakerName: speaker.data.name,
        ...(speaker.data.topic ? { speakerTopic: speaker.data.topic } : {}),
        speakerEmail: (speaker.data.email ?? "").trim(),
        speakerPhone: (speaker.data.phone ?? "").trim(),
        inviterName,
        bishopReplyToEmail: authUser?.email ?? "",
        bodyMarkdown: form.letterBody,
        footerMarkdown: form.letterFooter,
      });
      if (ok) onComplete();
    } else if (mode === "resend") {
      if (!invitation) {
        actions.setError("No prior invitation found to resend.");
        return;
      }
      await form.persistOverrides();
      const ok = await actions.resend({
        wardId,
        invitationId: invitation.invitationId,
        email: (speaker.data.email ?? "").trim(),
        phone: (speaker.data.phone ?? "").trim(),
      });
      if (ok) onComplete();
    } else {
      await form.persistOverrides();
      window.print();
      setPostPrint(true);
    }
  }

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

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
        <div className="px-5 sm:px-8 py-3 lg:h-full lg:flex lg:flex-col">
          <PrepareInvitationLetterTab
            key={form.resetKey}
            body={form.letterBody}
            footer={form.letterFooter}
            setBody={form.setLetterBody}
            setFooter={form.setLetterFooter}
            vars={vars}
          />
          {(form.error || actions.error) && (
            <p className="font-sans text-[12.5px] text-bordeaux mt-2">
              {form.error ?? actions.error}
            </p>
          )}
        </div>
      </div>
      <ReviewLetterFooter
        mode={mode}
        busy={actions.busy}
        onBack={onBack}
        onPrimary={handlePrimary}
      />
    </div>
  );
}
