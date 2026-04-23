import { Link } from "react-router";
import { PageRail } from "@/components/ui/PageRail";
import { SpeakerEmailSection } from "@/features/templates/SpeakerEmailSection";
import { SpeakerLetterSection } from "@/features/templates/SpeakerLetterSection";
import { WardInviteSection } from "@/features/templates/WardInviteSection";

const RAIL_ITEMS = [
  { id: "sec-speaker-letter", label: "Speaker invitation letter" },
  { id: "sec-speaker-email", label: "Speaker invitation email" },
  { id: "sec-ward-invite", label: "Ward invitation message" },
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
    <main className="pb-16">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/schedule" className="hover:text-walnut">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1.5">
          Ward administration
        </div>
        <h1 className="font-display text-[2.25rem] font-semibold text-walnut leading-tight">
          Templates
        </h1>
        <p className="font-serif italic text-[16px] text-walnut-2 mt-1">
          The messages Steward sends on your behalf — invitations, emails, and on-page letters.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-8 items-start">
        <div>
          <SpeakerLetterSection />
          <SpeakerEmailSection />
          <WardInviteSection />
        </div>

        <PageRail items={RAIL_ITEMS} elsewhere={RAIL_ELSEWHERE} label="Templates sections" />
      </div>
    </main>
  );
}
