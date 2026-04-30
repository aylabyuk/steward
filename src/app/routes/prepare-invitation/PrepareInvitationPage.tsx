import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { PrepareInvitationLetterTab } from "@/features/templates/PrepareInvitationLetterTab";
import { PrepareInvitationHeader } from "./PrepareInvitationHeader";
import { formatAssignedDate, formatToday } from "@/features/templates/utils/letterDates";
import { useSpeakerLetterTemplate } from "@/features/templates/hooks/useSpeakerLetterTemplate";
import { usePrepareInvitation } from "@/features/templates/hooks/usePrepareInvitation";
import { usePrepareInvitationActions } from "@/features/templates/hooks/usePrepareInvitationActions";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { PrepareInvitationPageMessage } from "../PrepareInvitationPageMessage";
import { computeSendValidation } from "./utils/prepareInvitationValidation";

export function PrepareInvitationPage() {
  const { date, speakerId } = useParams<{ date: string; speakerId: string }>();
  const navigate = useNavigate();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const ward = useWardSettings();
  const speakers = useSpeakers(date ?? null);
  const { data: letterTemplate } = useSpeakerLetterTemplate();
  const [done, setDone] = useState(false);

  const speaker = speakers.data?.find((s) => s.id === speakerId) ?? null;
  const form = usePrepareInvitation({
    wardId: wardId ?? "",
    date: date ?? "",
    speakerId: speakerId ?? "",
    open: Boolean(wardId && date && speakerId && speaker),
    letterTemplate,
  });

  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const wardName = ward.data?.name ?? "";

  const vars = useMemo(
    () => ({
      speakerName: speaker?.data.name ?? "",
      topic: speaker?.data.topic?.trim() || "a topic of your choosing",
      date: date ? formatAssignedDate(date) : "",
      today: formatToday(),
      wardName,
      inviterName,
    }),
    [speaker?.data.name, speaker?.data.topic, date, wardName, inviterName],
  );

  const actions = usePrepareInvitationActions({
    wardId: wardId ?? "",
    date: date ?? "",
    speakerId: speakerId ?? "",
    speakerName: speaker?.data.name ?? "",
    speakerEmail: speaker?.data.email ?? "",
    speakerPhone: speaker?.data.phone ?? "",
    speakerTopic: speaker?.data.topic ?? "",
    inviterName,
    form,
    onDone: () => setDone(true),
  });

  if (!wardId || !date || !speakerId) {
    return (
      <PrepareInvitationPageMessage
        title="Missing invitation context"
        body="Return to the schedule."
      />
    );
  }
  if (speakers.loading) {
    return <PrepareInvitationPageMessage title="Loading speaker…" body={null} />;
  }
  if (!speaker) {
    return (
      <PrepareInvitationPageMessage
        title="Speaker not found"
        body="This speaker may have been removed. Return to the schedule."
      />
    );
  }

  if (done) {
    return (
      <PrepareInvitationPageMessage
        title="Invitation sent"
        body="The speaker has been notified."
        backToSchedule
      />
    );
  }

  const { email, hasEmail } = computeSendValidation(speaker.data);

  const toolbarProps = {
    busy: form.busy,
    hasOverride: form.letterHasOverride,
    speakerName: speaker.data.name,
    speakerEmail: speaker.data.email ?? "",
    speakerPhone: speaker.data.phone ?? "",
    assignedDate: date,
    onRevert: () => void form.clearLetterOverride(),
    onSend: actions.send,
    onSendSms: actions.sendSms,
  };

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PrepareInvitationHeader
        email={email}
        hasEmail={hasEmail}
        onCancel={() => navigate("/schedule")}
        {...toolbarProps}
      />
      <div className="flex-1 min-h-0 lg:overflow-hidden">
        {form.hydrated ? (
          <PrepareInvitationLetterTab
            initialJson={form.initialJson}
            initialMarkdown={form.initialMarkdown}
            liveStateJson={form.letterStateJson}
            body={form.letterBody}
            footer={form.letterFooter}
            onChange={form.setLetterStateJson}
            onInitial={form.captureInitial}
            resetKey={form.resetKey}
            vars={vars}
          />
        ) : (
          <p className="px-5 sm:px-8 pt-5 pb-4 font-serif italic text-[14px] text-walnut-3">
            Loading letter…
          </p>
        )}
        {form.error && (
          <p className="px-5 sm:px-8 mt-4 font-sans text-[12.5px] text-bordeaux">{form.error}</p>
        )}
      </div>
    </main>
  );
}
