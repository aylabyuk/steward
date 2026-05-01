import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_PRAYER_INITIAL_INVITATION_SMS } from "./utils/serverTemplateDefaults";

const SAMPLE_INVITE_URL = "https://example.com/invite/speaker/your-ward/sample-token";

export function PrayerInitialSmsSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-prayer-initial-sms"
      eyebrow="SMS"
      title="Prayer invitation — SMS"
      description={
        <>
          The first text message the prayer-giver receives when you send an invitation. Delivered by
          Twilio.
        </>
      }
      templateKey="prayerInitialInvitationSms"
      defaultBody={DEFAULT_PRAYER_INITIAL_INVITATION_SMS}
      kind="sms"
      variables={[
        { name: "inviterName", hint: "Bishop or counselor sending the invitation" },
        { name: "wardName", hint: "Your ward name" },
        { name: "assignedDate", hint: "Pre-formatted Sunday, e.g. 'Sunday, April 26, 2026'" },
        { name: "inviteUrl", hint: "Personal invite-page link for the prayer-giver" },
        { name: "prayerType", hint: "'opening prayer' or 'closing prayer' per role" },
      ]}
      sampleVars={{
        inviterName: "Bishop Paul",
        wardName: "Eglinton Ward",
        assignedDate: "Sunday, April 26, 2026",
        inviteUrl: SAMPLE_INVITE_URL,
        prayerType: "opening prayer",
      }}
    />
  );
}
