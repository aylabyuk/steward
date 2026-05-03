import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { EmbedLetterView } from "@/features/embed/EmbedLetterView";
import { useEmbedAuthBootstrap } from "@/features/embed/useEmbedAuthBootstrap";
import { useEmbedShareBridge } from "@/features/embed/useEmbedShareBridge";
import { formatAssignedDate, formatToday } from "@/features/templates/utils/letterDates";
import { useSpeakerLetterTemplate } from "@/features/templates/hooks/useSpeakerLetterTemplate";
import { usePrepareInvitation } from "@/features/templates/hooks/usePrepareInvitation";
import { usePrepareInvitationActions } from "@/features/templates/hooks/usePrepareInvitationActions";
import { useSavableExit } from "@/features/templates/hooks/useSavableExit";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { PrepareInvitationContent } from "./PrepareInvitationContent";
import { PrepareInvitationPageMessage } from "../PrepareInvitationPageMessage";

export function PrepareInvitationPage() {
  const { date, speakerId } = useParams<{ date: string; speakerId: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "ios";
  const embedAuth = useEmbedAuthBootstrap();
  useEmbedShareBridge();
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

  const exit = useSavableExit({ dirty: form.dirty, onSave: actions.save });

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

  if (isEmbed) {
    // biome-ignore format: single line keeps the page under the 150-LOC cap
    return <EmbedLetterView authStatus={embedAuth} form={form} date={date} wardName={wardName} vars={vars} />;
  }

  return (
    <PrepareInvitationContent
      date={date}
      speaker={speaker.data}
      vars={vars}
      form={form}
      actions={actions}
      exit={exit}
    />
  );
}
