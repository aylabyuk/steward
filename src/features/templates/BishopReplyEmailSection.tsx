import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_BISHOP_REPLY_EMAIL } from "./utils/serverTemplateDefaults";

export function BishopReplyEmailSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-reply-email"
      eyebrow="Email"
      title="Bishop reply → speaker email"
      description={
        <>
          SendGrid email sent alongside the reply SMS (or on its own if the speaker has email but no
          phone). Author in plain text; the HTML version is rendered paragraph-by-paragraph.
        </>
      }
      templateKey="bishopReplyEmail"
      defaultBody={DEFAULT_BISHOP_REPLY_EMAIL}
      kind="email"
      variables={[
        { name: "inviterName", hint: "Bishopric member who posted the message" },
        { name: "assignedDate", hint: "Pre-formatted Sunday" },
        { name: "preview", hint: "First ~180 chars of the bishopric message" },
        { name: "wardName", hint: "Your ward name" },
      ]}
      sampleVars={{
        inviterName: "Bishop Paul",
        assignedDate: "Sunday, April 26, 2026",
        preview: "Thanks for agreeing to speak! Any topic in mind yet?",
        wardName: "Eglinton Ward",
      }}
    />
  );
}
