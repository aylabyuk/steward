import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_SPEAKER_RESPONSE_DECLINED } from "./serverTemplateDefaults";

export function SpeakerResponseDeclinedSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-response-declined"
      eyebrow="Receipt"
      title="Speaker response — declined"
      description={
        <>
          Header of the email the speaker gets when they tap No. The letter excerpt and safety note
          stay structural below this text.
        </>
      }
      templateKey="speakerResponseDeclined"
      defaultBody={DEFAULT_SPEAKER_RESPONSE_DECLINED}
      kind="email"
      variables={[
        { name: "speakerName", hint: "Display name from the speaker form" },
        { name: "assignedDate", hint: "Pre-formatted Sunday" },
        { name: "reason", hint: "Optional note the speaker typed (blank if absent)" },
      ]}
      sampleVars={{
        speakerName: "Sebastian Tan",
        assignedDate: "Sunday, April 26, 2026",
        reason: "Out of town that weekend",
      }}
    />
  );
}
