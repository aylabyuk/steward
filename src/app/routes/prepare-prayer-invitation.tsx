import { useMemo, useState } from "react";
import { useParams } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useMeeting } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { usePrayerLetterTemplate } from "@/features/templates/hooks/usePrayerLetterTemplate";
import { PrepareInvitationLetterTab } from "@/features/templates/PrepareInvitationLetterTab";
import { formatAssignedDate, formatToday } from "@/features/templates/utils/letterDates";
import { isPlausiblePhone } from "@/features/templates/utils/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { type PrayerRole, prayerRoleSchema } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { usePreparePrayerInvitation } from "@/features/prayers/hooks/usePreparePrayerInvitation";
import { usePreparePrayerActions } from "@/features/prayers/hooks/usePreparePrayerActions";
import { PreparePrayerInvitationHeader } from "./PreparePrayerInvitationHeader";
import { PrepareInvitationPageMessage } from "./PrepareInvitationPageMessage";

export function PreparePrayerInvitationPage() {
  const { date, role: roleParam } = useParams<{ date: string; role: string }>();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const ward = useWardSettings();
  const { data: letterTemplate } = usePrayerLetterTemplate();
  const meeting = useMeeting(date ?? null);
  const roleParseResult = roleParam ? prayerRoleSchema.safeParse(roleParam) : null;
  const role: PrayerRole | null = roleParseResult?.success ? roleParseResult.data : null;
  const participant = usePrayerParticipant(date ?? null, role ?? "opening");
  const [done, setDone] = useState(false);

  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const wardName = ward.data?.name ?? "";

  // Resolve the prayer-giver's name + contact: prefer the structured
  // participant doc (set once invited / overridden), fall back to the
  // lightweight `meeting.{role}.person` Assignment row the bishop
  // typed inline. Email + phone live only on the participant doc.
  const inlineAssignment =
    role === "opening" ? meeting.data?.openingPrayer : meeting.data?.benediction;
  const prayerGiverName = participant.data?.name ?? inlineAssignment?.person?.name ?? "";
  const prayerGiverEmail = participant.data?.email ?? "";
  const prayerGiverPhone = participant.data?.phone ?? "";

  const form = usePreparePrayerInvitation({
    wardId: wardId ?? "",
    date: date ?? "",
    role: role ?? "opening",
    open: Boolean(wardId && date && role),
    letterTemplate,
  });

  const vars = useMemo(
    () => ({
      speakerName: prayerGiverName,
      prayerGiverName,
      prayerType: role === "opening" ? "opening prayer" : "benediction",
      date: date ? formatAssignedDate(date) : "",
      today: formatToday(),
      wardName,
      inviterName,
    }),
    [prayerGiverName, role, date, wardName, inviterName],
  );

  const actions = usePreparePrayerActions({
    wardId: wardId ?? "",
    date: date ?? "",
    role: role ?? "opening",
    prayerGiverName,
    prayerGiverEmail,
    prayerGiverPhone,
    inviterName,
    form,
    onDone: () => setDone(true),
  });

  if (!wardId || !date || !role) {
    return (
      <PrepareInvitationPageMessage
        title="Missing invitation context"
        body="Return to the schedule."
      />
    );
  }
  if (!prayerGiverName) {
    return (
      <PrepareInvitationPageMessage
        title="No name set"
        body="Add a name in the meeting's Prayers section before sending an invitation."
      />
    );
  }
  if (done) {
    return (
      <PrepareInvitationPageMessage
        title="Invitation sent"
        body="The prayer-giver has been notified. This tab will close on its own."
        close
      />
    );
  }

  const hasEmail = isValidEmail(prayerGiverEmail);
  const hasPhone = isPlausiblePhone(prayerGiverPhone);
  const canSend = hasEmail;
  const canSms = hasPhone;
  const canSendReason = hasEmail ? "" : "Add an email address.";
  const canSmsReason = hasPhone ? "" : "Add a phone number.";

  const toolbarProps = {
    busy: form.busy,
    canSend,
    canSendReason,
    canSms,
    canSmsReason,
    hasOverride: form.letterHasOverride,
    speakerName: prayerGiverName,
    speakerEmail: prayerGiverEmail,
    speakerPhone: prayerGiverPhone,
    onRevert: () => void form.clearLetterOverride(),
    onMarkInvited: actions.markInvited,
    onPrint: () => window.print(),
    onSend: actions.send,
    onSendSms: actions.sendSms,
  };

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PreparePrayerInvitationHeader
        role={role}
        email={prayerGiverEmail}
        hasEmail={hasEmail}
        onCancel={() => window.close()}
        {...toolbarProps}
      />
      <div className="flex-1 min-h-0 lg:overflow-hidden px-5 sm:px-8 pt-5 pb-4">
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
          <p className="font-serif italic text-[14px] text-walnut-3">Loading letter…</p>
        )}
        {form.error && <p className="mt-4 font-sans text-[12.5px] text-bordeaux">{form.error}</p>}
      </div>
    </main>
  );
}
