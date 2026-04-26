import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_INITIAL_INVITATION_SMS } from "./serverTemplateDefaults";

const SAMPLE_INVITE_URL = "https://example.com/invite/speaker/your-ward/sample-token";

export function InitialSmsSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-initial-sms"
      eyebrow="SMS"
      title="Speaker invitation — SMS"
      description={
        <>
          The first text message the speaker receives when you send an invitation. Delivered by
          Twilio.
        </>
      }
      templateKey="initialInvitationSms"
      defaultBody={DEFAULT_INITIAL_INVITATION_SMS}
      kind="sms"
      variables={[
        { name: "inviterName", hint: "Bishop or counselor sending the invitation" },
        { name: "wardName", hint: "Your ward name" },
        { name: "assignedDate", hint: "Pre-formatted Sunday, e.g. 'Sunday, April 26, 2026'" },
        { name: "inviteUrl", hint: "Personal invite-page link for the speaker" },
      ]}
      sampleVars={{
        inviterName: "Bishop Paul",
        wardName: "Eglinton Ward",
        assignedDate: "Sunday, April 26, 2026",
        inviteUrl: SAMPLE_INVITE_URL,
      }}
    />
  );
}
