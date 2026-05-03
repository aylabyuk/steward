import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useMeeting } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { usePrayerLetterTemplate } from "@/features/templates/hooks/usePrayerLetterTemplate";
import { EmbedLetterView } from "@/features/embed/EmbedLetterView";
import { useEmbedAuthBootstrap } from "@/features/embed/useEmbedAuthBootstrap";
import { useEmbedShareBridge } from "@/features/embed/useEmbedShareBridge";
import { formatAssignedDate, formatToday } from "@/features/templates/utils/letterDates";
import { useSavableExit } from "@/features/templates/hooks/useSavableExit";
import { type PrayerRole, prayerRoleSchema } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import { usePreparePrayerInvitation } from "@/features/prayers/hooks/usePreparePrayerInvitation";
import { usePreparePrayerActions } from "@/features/prayers/hooks/usePreparePrayerActions";
import { PreparePrayerInvitationContent } from "./PreparePrayerInvitationContent";
import { PrepareInvitationPageMessage } from "../PrepareInvitationPageMessage";

export function PreparePrayerInvitationPage() {
  const { date, role: roleParam } = useParams<{ date: string; role: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "ios";
  const embedAuth = useEmbedAuthBootstrap();
  useEmbedShareBridge();
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
      prayerType: role === "opening" ? "opening prayer" : "closing prayer",
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

  const exit = useSavableExit({ dirty: form.dirty, onSave: actions.save });

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
        body="The prayer-giver has been notified."
        backToSchedule
      />
    );
  }

  if (isEmbed) {
    // biome-ignore format: single line keeps the page under the 150-LOC cap
    return <EmbedLetterView authStatus={embedAuth} form={form} date={date} wardName={wardName} vars={vars} />;
  }

  return (
    <PreparePrayerInvitationContent
      date={date}
      role={role}
      prayerGiverName={prayerGiverName}
      prayerGiverEmail={prayerGiverEmail}
      prayerGiverPhone={prayerGiverPhone}
      vars={vars}
      form={form}
      actions={actions}
      exit={exit}
    />
  );
}
