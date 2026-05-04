import {
  DividerStrong,
  DividerThin,
  Masthead,
  SectionLabel,
  Sheet,
  SheetFooter,
} from "./ConductingDesignParts";

export interface Page2Props {
  wardName: string;
  dateLong: string;
  announcements: string;
  wardBusiness: string;
  stakeBusiness: string;
  footerLeft: string;
}

interface SectionConfig {
  step: string;
  label: string;
  body: string;
  emptyHint: string;
}

/** Page 2 of the conducting copy — long-form items pointed at from
 *  page 1's "See page 2" rows. Per current scope, the section bodies
 *  are simple plain text from the meeting doc (announcements, ward
 *  business, stake business). The structured numbered list, calling
 *  list, and stage-cue script blocks from the original mockup are
 *  deferred — the headers + step tags stay so the document still
 *  reads as the matching second sheet. */
export function ConductingDesignPage2(p: Page2Props) {
  const sections: SectionConfig[] = [
    {
      step: "Step 1",
      label: "Announcements",
      body: p.announcements,
      emptyHint: "Per-week announcements appear here when filled in on the prepare page.",
    },
    {
      step: "Step 3",
      label: "Ward business",
      body: p.wardBusiness,
      emptyHint: "Releases, sustainings, and other ward business — typed in during planning.",
    },
    {
      step: "Step 3",
      label: "Stake business",
      body: p.stakeBusiness,
      emptyHint: "Stake-level items, e.g. handing time over to a high councillor.",
    },
  ];

  return (
    <Sheet>
      <Masthead
        eyebrow="Conducting copy · Page 2"
        title="Notes & long-form items"
        meta={[p.wardName, p.dateLong]}
      />
      <DividerStrong />
      {sections.map((section, i) => (
        <Section
          key={section.label}
          step={section.step}
          label={section.label}
          body={section.body}
          emptyHint={section.emptyHint}
          showThinDivider={i > 0}
        />
      ))}
      <SheetFooter left={p.footerLeft} right="Conducting copy" />
    </Sheet>
  );
}

interface SectionProps extends SectionConfig {
  showThinDivider: boolean;
}

function Section({ step, label, body, emptyHint, showThinDivider }: SectionProps) {
  return (
    <>
      {showThinDivider && <DividerThin />}
      <section className="mb-[18px]">
        <div className="flex items-baseline gap-3 mb-[14px]">
          <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-white bg-brass-deep px-2 py-[2px] rounded-[3px]">
            {step}
          </span>
          <SectionLabel>{label}</SectionLabel>
        </div>
        <Body body={body} emptyHint={emptyHint} />
      </section>
    </>
  );
}

function Body({ body, emptyHint }: { body: string; emptyHint: string }) {
  const trimmed = body.trim();
  if (trimmed.length === 0) {
    return (
      <p className="font-serif italic text-[14.5px] leading-[1.45] text-walnut-3 border-l-2 border-brass-soft pl-2.5 m-0">
        {emptyHint}
      </p>
    );
  }
  return (
    <p className="font-serif text-[16px] leading-[1.6] text-ink whitespace-pre-wrap m-0">
      {trimmed}
    </p>
  );
}
