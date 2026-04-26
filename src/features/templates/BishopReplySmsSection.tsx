import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_BISHOP_REPLY_SMS } from "./serverTemplateDefaults";

const SAMPLE_INVITE_URL = "https://example.com/invite/speaker/your-ward/sample-token";

export function BishopReplySmsSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-reply-sms"
      eyebrow="SMS"
      title="Bishop reply → speaker SMS"
      description={
        <>
          Sent to the speaker's phone when a member of the bishopric posts a reply in the chat and
          the speaker's web session isn't presumed open.
        </>
      }
      templateKey="bishopReplySms"
      defaultBody={DEFAULT_BISHOP_REPLY_SMS}
      kind="sms"
      variables={[
        { name: "wardName", hint: "Your ward name" },
        { name: "preview", hint: "First ~240 chars of the bishopric message" },
        { name: "inviteUrl", hint: "Fresh invite-page link (rotated at send time)" },
      ]}
      sampleVars={{
        wardName: "Eglinton Ward",
        preview: "Thanks for agreeing to speak! Any topic in mind yet?",
        inviteUrl: SAMPLE_INVITE_URL,
      }}
    />
  );
}
