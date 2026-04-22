import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { PrepareInvitationActionBar } from "@/features/templates/PrepareInvitationActionBar";
import { PrepareInvitationLetterTab } from "@/features/templates/PrepareInvitationLetterTab";
import { PrepareInvitationHeader } from "./PrepareInvitationHeader";
import { formatAssignedDate, formatToday } from "@/features/templates/letterDates";
import { useSpeakerEmailTemplate } from "@/features/templates/useSpeakerEmailTemplate";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { usePrepareInvitation } from "@/features/templates/usePrepareInvitation";
import { usePrepareInvitationActions } from "@/features/templates/usePrepareInvitationActions";
import { isValidEmail } from "@/lib/email";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { PrepareInvitationPageMessage } from "./PrepareInvitationPageMessage";

export function PrepareInvitationPage() {
  const { date, speakerId } = useParams<{ date: string; speakerId: string }>();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const ward = useWardSettings();
  const speakers = useSpeakers(date ?? null);
  const { data: letterTemplate } = useSpeakerLetterTemplate();
  const { data: emailTemplate } = useSpeakerEmailTemplate();
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
    speakerTopic: speaker?.data.topic ?? "",
    inviterName,
    vars,
    form,
    emailTemplate,
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
        title="Done"
        body="You can close this tab — or return to Schedule to review the status."
        close
      />
    );
  }

  const email = (speaker.data.email ?? "").trim();
  const hasEmail = email.length > 0;
  const emailValid = isValidEmail(email);
  const canSend = hasEmail && emailValid;
  const canSendReason = !hasEmail
    ? "No email on file — print or mark invited instead."
    : !emailValid
      ? "Invalid email format."
      : null;

  const toolbarProps = {
    busy: form.busy,
    canSend,
    canSendReason,
    hasOverride: form.letterHasOverride,
    speakerName: speaker.data.name,
    onRevert: () => void form.clearLetterOverride(),
    onMarkInvited: actions.markInvited,
    // Global `@media print` rules pin the preview's LetterCanvas to
    // the sheet at true 8.5×11 — WYSIWYG, no new route, no re-read.
    onPrint: () => window.print(),
    onSend: actions.send,
  };

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PrepareInvitationHeader
        email={email}
        hasEmail={hasEmail}
        onCancel={() => window.close()}
        {...toolbarProps}
      />
      <div className="flex-1 min-h-0 lg:overflow-hidden px-5 sm:px-8 pt-5 pb-4">
        {form.hydrated ? (
          <PrepareInvitationLetterTab
            key={form.resetKey}
            body={form.letterBody}
            footer={form.letterFooter}
            setBody={form.setLetterBody}
            setFooter={form.setLetterFooter}
            vars={vars}
            previewToolbar={<PrepareInvitationActionBar {...toolbarProps} />}
          />
        ) : (
          <p className="font-serif italic text-[14px] text-walnut-3">Loading letter…</p>
        )}
        {form.error && <p className="mt-4 font-sans text-[12.5px] text-bordeaux">{form.error}</p>}
      </div>
    </main>
  );
}
