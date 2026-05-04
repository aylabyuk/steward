import type { ReactNode } from "react";
import {
  DividerStrong,
  DividerThin,
  EmDash,
  Masthead,
  SectionLabel,
  Sheet,
  SheetFooter,
} from "./ConductingDesignParts";

export interface AgendaCue {
  text: string;
}
export interface AgendaSub {
  label: string;
  value: ReactNode;
}
export interface AgendaItem {
  num: string;
  label: string;
  value: ReactNode;
  sub?: AgendaSub | undefined;
  cue?: AgendaCue | undefined;
}
export interface Page1Props {
  wardName: string;
  dateLong: string;
  timeText: string;
  presiding: string;
  conducting: string;
  pianist: string;
  chorister: string;
  visitors: string;
  agenda: AgendaItem[];
  footerLeft: string;
}

/** Page 1 of the conducting copy — masthead, officers grid, numbered
 *  agenda with sub-rows + italic stage cues, footer with ornament.
 *  Pixel-mirrors the Conductors Page.html design from Claude Design. */
export function ConductingDesignPage1(p: Page1Props) {
  return (
    <Sheet>
      <Masthead
        eyebrow="Conducting copy"
        title="Sacrament meeting"
        meta={[p.wardName, p.dateLong, p.timeText]}
      />
      <DividerStrong />
      <Officers
        presiding={p.presiding}
        conducting={p.conducting}
        pianist={p.pianist}
        chorister={p.chorister}
        visitors={p.visitors}
      />
      <DividerThin />
      <Agenda items={p.agenda} />
      <SheetFooter left={p.footerLeft} right="Conducting copy" />
    </Sheet>
  );
}

interface OfficersProps {
  presiding: string;
  conducting: string;
  pianist: string;
  chorister: string;
  visitors: string;
}

function Officers({ presiding, conducting, pianist, chorister, visitors }: OfficersProps) {
  return (
    <section>
      <SectionLabel>Officers</SectionLabel>
      <div className="grid grid-cols-2 gap-x-9 gap-y-2 text-[16px] leading-[1.5] text-ink">
        <OfficerRow role="Presiding" name={presiding} />
        <OfficerRow role="Conducting" name={conducting} />
        <OfficerRow role="Pianist" name={pianist} />
        <OfficerRow role="Chorister" name={chorister} />
        <div className="col-span-2">
          <OfficerRow role="Visitors" name={visitors} />
        </div>
      </div>
    </section>
  );
}

function OfficerRow({ role, name }: { role: string; name: string }) {
  return (
    <div>
      <span className="font-semibold">{role}</span>
      <span className="mx-1.5 text-walnut-3">·</span>
      <span>{name}</span>
    </div>
  );
}

function Agenda({ items }: { items: AgendaItem[] }) {
  return (
    <section>
      <SectionLabel>Order of meeting</SectionLabel>
      <div className="mt-1">
        {items.map((item, i) => (
          <AgendaRow key={item.num} item={item} isLast={i === items.length - 1} />
        ))}
      </div>
    </section>
  );
}

function AgendaRow({ item, isLast }: { item: AgendaItem; isLast: boolean }) {
  const noBorder = isLast && !item.sub && !item.cue;
  return (
    <>
      <div
        className={`grid grid-cols-[36px_1fr] items-baseline gap-x-1 py-[7px] ${
          noBorder ? "" : "border-b border-dotted border-[#e3d7be]"
        }`}
      >
        <div className="font-serif font-semibold text-[22px] leading-none text-brass-deep pt-0.5">
          {item.num}
        </div>
        <div className="text-[17px] leading-[1.45] text-ink">
          <span className="font-semibold">{item.label}</span>
          <EmDash />
          {item.value}
        </div>
      </div>
      {item.sub && (
        <div className="grid grid-cols-[36px_1fr] gap-x-1 pt-1 pb-1.5">
          <div />
          <div className="text-[16px] text-ink">
            <span className="font-semibold">{item.sub.label}</span>
            <EmDash />
            {item.sub.value}
          </div>
        </div>
      )}
      {item.cue && (
        <div className="grid grid-cols-[36px_1fr] gap-x-1 pt-0.5 pb-1">
          <div />
          <div className="font-serif italic text-[14.5px] leading-[1.45] text-walnut-3 border-l-2 border-brass-soft pl-2.5 -ml-0.5">
            {item.cue.text}
          </div>
        </div>
      )}
    </>
  );
}
