import { MessageTemplateCard } from "./MessageTemplateCard";
import { DEFAULT_BISHOPRIC_RESPONSE_RECEIPT } from "./utils/serverTemplateDefaults";

export function BishopricResponseReceiptSection(): React.ReactElement {
  return (
    <MessageTemplateCard
      sectionId="sec-bishopric-receipt"
      eyebrow="Receipt"
      title="Bishopric notice — response applied"
      description={
        <>
          Opening line of the email the bishopric receives after a response is applied. Responded-
          at, applied-by, and the original letter render structurally below.
        </>
      }
      templateKey="bishopricResponseReceipt"
      defaultBody={DEFAULT_BISHOPRIC_RESPONSE_RECEIPT}
      kind="email"
      variables={[
        { name: "speakerName", hint: "Speaker who replied" },
        { name: "verb", hint: "Literal 'accepted' or 'declined' — use exactly as written" },
        { name: "assignedDate", hint: "Pre-formatted Sunday" },
      ]}
      sampleVars={{
        speakerName: "Sebastian Tan",
        verb: "accepted",
        assignedDate: "Sunday, April 26, 2026",
      }}
    />
  );
}
