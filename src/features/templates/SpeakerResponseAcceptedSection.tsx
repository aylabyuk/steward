import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_SPEAKER_RESPONSE_ACCEPTED } from "./serverTemplateDefaults";

export function SpeakerResponseAcceptedSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-response-accepted"
      eyebrow="Receipt"
      title="Speaker response — accepted"
      description={
        <>
          Header of the email the speaker gets when they tap Yes. The original letter and a
          safety-check line are appended automatically below this body.
        </>
      }
      templateKey="speakerResponseAccepted"
      defaultBody={DEFAULT_SPEAKER_RESPONSE_ACCEPTED}
      kind="email"
      variables={[
        { name: "speakerName", hint: "Display name from the speaker form" },
        { name: "assignedDate", hint: "Pre-formatted Sunday" },
        { name: "reason", hint: "Optional note the speaker typed (blank if absent)" },
      ]}
      sampleVars={{
        speakerName: "Sebastian Tan",
        assignedDate: "Sunday, April 26, 2026",
        reason: "",
      }}
    />
  );
}
