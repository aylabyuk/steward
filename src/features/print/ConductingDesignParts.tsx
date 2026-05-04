import type { ReactNode } from "react";

/** Shared visual primitives for the conducting copy design — used by
 *  both Page 1 (numbered agenda) and Page 2 (long-form notes). Maps
 *  Steward design tokens onto the typography vocabulary from
 *  Conductors Page.html: Newsreader serif body, IBM Plex Mono
 *  eyebrows, walnut/brass-deep ink, hairline rules in #d3c6ad. */

/** A single 8.5×11 white sheet at print scale. The on-screen preview
 *  centres it on a parchment surround; print routes drop the
 *  shadow and let `@page` margins handle the bleed. */
export function Sheet({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative bg-white shadow-[0_2px_6px_rgba(0,0,0,0.06),0_18px_50px_rgba(0,0,0,0.12)] mx-auto print:shadow-none"
      style={{ width: "8.5in", minHeight: "11in", padding: "0.85in" }}
    >
      {children}
    </div>
  );
}

export function Masthead({
  eyebrow,
  title,
  meta,
}: {
  eyebrow: string;
  title: string;
  meta: string[];
}) {
  return (
    <header className="text-center mb-[22px]">
      <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-brass-deep m-0 mb-2.5">
        {eyebrow}
      </p>
      <h1 className="font-serif italic font-medium text-[36px] leading-none text-ink m-0 mb-3 tracking-[-0.005em]">
        {title}
      </h1>
      <p className="font-mono text-[12.5px] tracking-[0.06em] text-walnut-2 m-0">
        {meta.map((part, i) => (
          <span key={part}>
            {i > 0 && <span className="mx-2.5 text-walnut-3">·</span>}
            <span style={{ whiteSpace: "nowrap" }}>{part}</span>
          </span>
        ))}
      </p>
    </header>
  );
}

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[11px] tracking-[0.20em] uppercase text-brass-deep m-0 mb-2.5">
      {children}
    </p>
  );
}

export function DividerStrong() {
  return <hr className="border-0 border-t-[1.5px] border-walnut mt-[18px] mb-[16px]" />;
}

export function DividerThin() {
  return <hr className="border-0 border-t border-[#d3c6ad] my-[14px]" />;
}

export function SheetFooter({ left, right }: { left: string; right: string }) {
  return (
    <footer className="mt-7 pt-3 border-t border-[#d3c6ad] flex justify-between items-baseline font-mono text-[10.5px] tracking-[0.10em] uppercase text-walnut-3">
      <span>{left}</span>
      <span className="tracking-[0.4em] text-brass-deep">✦ ✦ ✦</span>
      <span>{right}</span>
    </footer>
  );
}

export function EmDash() {
  return <span className="mx-1.5 text-walnut-3">—</span>;
}
