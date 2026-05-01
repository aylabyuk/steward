import { useSearchParams } from "react-router";
import { AppBar } from "@/components/ui/AppBar";
import { ProgramTemplatesSection } from "@/features/program-templates/ProgramTemplatesSection";
import { BishopReplyEmailSection } from "@/features/templates/BishopReplyEmailSection";
import { BishopReplySmsSection } from "@/features/templates/BishopReplySmsSection";
import { BishopricResponseReceiptSection } from "@/features/templates/BishopricResponseReceiptSection";
import { InitialSmsSection } from "@/features/templates/InitialSmsSection";
import { PrayerBishopricResponseReceiptSection } from "@/features/templates/PrayerBishopricResponseReceiptSection";
import { PrayerEmailSection } from "@/features/templates/PrayerEmailSection";
import { PrayerInitialSmsSection } from "@/features/templates/PrayerInitialSmsSection";
import { PrayerLetterSection } from "@/features/templates/PrayerLetterSection";
import { PrayerResponseAcceptedSection } from "@/features/templates/PrayerResponseAcceptedSection";
import { PrayerResponseDeclinedSection } from "@/features/templates/PrayerResponseDeclinedSection";
import { SpeakerEmailSection } from "@/features/templates/SpeakerEmailSection";
import { SpeakerLetterSection } from "@/features/templates/SpeakerLetterSection";
import { SpeakerResponseAcceptedSection } from "@/features/templates/SpeakerResponseAcceptedSection";
import { SpeakerResponseDeclinedSection } from "@/features/templates/SpeakerResponseDeclinedSection";
import { WardInviteSection } from "@/features/templates/WardInviteSection";
import { type Audience, TemplatesAudienceTabs, parseAudience } from "./TemplatesAudienceTabs";

/** /settings/templates — single home for every editable message the
 *  ward sends. The page is segmented into three audience tabs
 *  (Speaker / Prayer / Other) — bishopric editors that target the
 *  speaker or prayer flow live under the matching tab; everything
 *  else (program, bishop chat replies, ward member invites) sits in
 *  Other. Each section saves itself; full-page editors (Letter,
 *  Program) link out to dedicated routes. */
export function TemplatesPage(): React.ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = parseAudience(searchParams.get("audience"));

  function setActive(next: Audience) {
    setSearchParams(
      (prev) => {
        const out = new URLSearchParams(prev);
        out.set("audience", next);
        return out;
      },
      { replace: true },
    );
  }

  return (
    <>
      <AppBar
        eyebrow="Ward administration"
        title="Templates"
        description="The messages Steward sends on your behalf — invitations, receipts, and chat notifications."
      />
      <main className="w-full max-w-380 mx-auto px-4 sm:px-8 py-6 pb-16">
        <TemplatesAudienceTabs active={active} onChange={setActive} />
        {active === "speaker" && <SpeakerSections />}
        {active === "prayer" && <PrayerSections />}
        {active === "other" && <OtherSections />}
      </main>
    </>
  );
}

function SpeakerSections() {
  return (
    <>
      <SpeakerLetterSection />
      <SpeakerEmailSection />
      <InitialSmsSection />
      <SpeakerResponseAcceptedSection />
      <SpeakerResponseDeclinedSection />
      <BishopricResponseReceiptSection />
    </>
  );
}

function PrayerSections() {
  return (
    <>
      <PrayerLetterSection />
      <PrayerEmailSection />
      <PrayerInitialSmsSection />
      <PrayerResponseAcceptedSection />
      <PrayerResponseDeclinedSection />
      <PrayerBishopricResponseReceiptSection />
    </>
  );
}

function OtherSections() {
  return (
    <>
      <ProgramTemplatesSection />
      <BishopReplySmsSection />
      <BishopReplyEmailSection />
      <WardInviteSection />
    </>
  );
}
