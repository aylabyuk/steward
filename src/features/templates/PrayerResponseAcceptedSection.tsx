import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_PRAYER_RESPONSE_ACCEPTED } from "./utils/serverTemplateDefaults";

export function PrayerResponseAcceptedSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-prayer-response-accepted"
      eyebrow="Receipt"
      title="Prayer response — accepted"
      description={
        <>
          Header of the email the prayer-giver gets when they tap Yes. The original letter and a
          safety-check line are appended automatically below this body.
        </>
      }
      templateKey="prayerResponseAccepted"
      defaultBody={DEFAULT_PRAYER_RESPONSE_ACCEPTED}
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
        reason: "",
      }}
    />
  );
}
