import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_PRAYER_RESPONSE_DECLINED } from "./utils/serverTemplateDefaults";

export function PrayerResponseDeclinedSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-prayer-response-declined"
      eyebrow="Receipt"
      title="Prayer response — declined"
      description={
        <>
          Header of the email the prayer-giver gets when they tap No. The letter excerpt and safety
          note stay structural below this text.
        </>
      }
      templateKey="prayerResponseDeclined"
      defaultBody={DEFAULT_PRAYER_RESPONSE_DECLINED}
      kind="email"
      variables={[
        { name: "speakerName", hint: "Display name of the prayer-giver" },
        { name: "assignedDate", hint: "Pre-formatted Sunday" },
        { name: "prayerType", hint: "'opening prayer' or 'closing prayer' per role" },
        { name: "reason", hint: "Optional note the prayer-giver typed (blank if absent)" },
      ]}
      sampleVars={{
        speakerName: "Sebastian Tan",
        assignedDate: "Sunday, April 26, 2026",
        prayerType: "opening prayer",
        reason: "Out of town that weekend",
      }}
    />
  );
}
