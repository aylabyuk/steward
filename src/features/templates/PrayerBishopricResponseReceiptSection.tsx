import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_PRAYER_BISHOPRIC_RESPONSE_RECEIPT } from "./utils/serverTemplateDefaults";

export function PrayerBishopricResponseReceiptSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-prayer-bishopric-receipt"
      eyebrow="Receipt"
      title="Bishopric notice — prayer response applied"
      description={
        <>
          Opening line of the email the bishopric receives after a prayer-giver's response is
          applied. Responded-at, applied-by, and the original letter render structurally below.
        </>
      }
      templateKey="prayerBishopricResponseReceipt"
      defaultBody={DEFAULT_PRAYER_BISHOPRIC_RESPONSE_RECEIPT}
      kind="email"
      variables={[
        { name: "speakerName", hint: "Prayer-giver who replied" },
        { name: "verb", hint: "Literal 'accepted' or 'declined' — use exactly as written" },
        { name: "assignedDate", hint: "Pre-formatted Sunday" },
        { name: "prayerType", hint: "'opening prayer' or 'closing prayer' per role" },
      ]}
      sampleVars={{
        speakerName: "Sebastian Tan",
        verb: "accepted",
        assignedDate: "Sunday, April 26, 2026",
        prayerType: "opening prayer",
      }}
    />
  );
}
