import { AppBar } from "@/components/ui/AppBar";
import { PageRail } from "@/components/ui/PageRail";
import { ProgramTemplatesSection } from "@/features/program-templates/ProgramTemplatesSection";
import { BishopReplyEmailSection } from "@/features/templates/BishopReplyEmailSection";
import { BishopReplySmsSection } from "@/features/templates/BishopReplySmsSection";
import { BishopricResponseReceiptSection } from "@/features/templates/BishopricResponseReceiptSection";
import { InitialSmsSection } from "@/features/templates/InitialSmsSection";
import { PrayerLetterSection } from "@/features/templates/PrayerLetterSection";
import { SpeakerEmailSection } from "@/features/templates/SpeakerEmailSection";
import { SpeakerLetterSection } from "@/features/templates/SpeakerLetterSection";
import { SpeakerResponseAcceptedSection } from "@/features/templates/SpeakerResponseAcceptedSection";
import { SpeakerResponseDeclinedSection } from "@/features/templates/SpeakerResponseDeclinedSection";
import { WardInviteSection } from "@/features/templates/WardInviteSection";

const RAIL_ITEMS = [
  { id: "sec-program-templates", label: "Program", group: "Sacrament meeting" },
  { id: "sec-speaker-letter", label: "Letter", group: "Speaker invitation" },
  { id: "sec-speaker-email", label: "Email", group: "Speaker invitation" },
  { id: "sec-initial-sms", label: "SMS", group: "Speaker invitation" },
  { id: "sec-prayer-letter", label: "Letter", group: "Prayer invitation" },
  { id: "sec-response-accepted", label: "Accepted", group: "Response receipts" },
  { id: "sec-response-declined", label: "Declined", group: "Response receipts" },
  { id: "sec-bishopric-receipt", label: "Bishopric notice", group: "Response receipts" },
  { id: "sec-reply-sms", label: "Reply SMS", group: "Conversation" },
  { id: "sec-reply-email", label: "Reply email", group: "Conversation" },
  { id: "sec-ward-invite", label: "Invitation message", group: "Ward members" },
];

const RAIL_ELSEWHERE = [
  { to: "/settings/ward", label: "Ward settings" },
  { to: "/settings/profile", label: "Your profile" },
];

/** /settings/templates — single home for every editable message the
 *  ward sends. Each section saves itself (distinct Firestore docs);
 *  PageRail on the right jumps between them. The speaker invitation
 *  LETTER has its own standalone route because its preview needs the
 *  full viewport — the section here links out in a new tab. */
export function TemplatesPage(): React.ReactElement {
  return (
    <>
      <AppBar
        eyebrow="Ward administration"
        title="Templates"
        description="The messages Steward sends on your behalf — invitations, receipts, and chat notifications."
      />
      <main className="w-full max-w-380 mx-auto px-4 sm:px-8 py-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-8 items-start">
          <div>
            <ProgramTemplatesSection />
            <SpeakerLetterSection />
            <SpeakerEmailSection />
            <InitialSmsSection />
            <PrayerLetterSection />
            <SpeakerResponseAcceptedSection />
            <SpeakerResponseDeclinedSection />
            <BishopricResponseReceiptSection />
            <BishopReplySmsSection />
            <BishopReplyEmailSection />
            <WardInviteSection />
          </div>

          <PageRail items={RAIL_ITEMS} elsewhere={RAIL_ELSEWHERE} label="Templates sections" />
        </div>
      </main>
    </>
  );
}
