import type { ReactNode } from "react";

export function RowLabeled({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-baseline gap-4 py-1.5 border-b border-dotted border-border last:border-b-0">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brass-deep">
        {label}
      </span>
      <span className="font-serif text-[15px] text-walnut">
        {value && value.trim().length > 0 ? (
          value
        ) : (
          <span className="print-blank inline-block w-full" />
        )}
      </span>
    </div>
  );
}

export function RowHymn({
  label,
  number,
  title,
}: {
  label: string;
  number: number | null | undefined;
  title: string | null | undefined;
}) {
  const empty = !number || !title;
  return (
    <div className="grid grid-cols-[140px_1fr] items-baseline gap-4 py-1.5 border-b border-dotted border-border last:border-b-0">
      <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brass-deep">
        {label}
      </span>
      <span className="font-serif text-[15px] text-walnut">
        {empty ? (
          <span className="print-blank inline-block w-full" />
        ) : (
          <>
            <span className="font-sans font-semibold text-bordeaux-deep mr-2">#{number}</span>
            <span className="italic">{title}</span>
          </>
        )}
      </span>
    </div>
  );
}

/**
 * Italic serif "script" / cue line the conductor reads aloud.
 * Distinct from an assignment row — no label column, full width, muted.
 */
export function ScriptLine({ children }: { children: ReactNode }) {
  return (
    <p className="font-serif italic text-[13.5px] text-walnut-2 border-l-2 border-brass-soft pl-3 my-2.5">
      {children}
    </p>
  );
}

export function RowSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 mb-2">
      <h3 className="font-display text-[16px] font-semibold text-walnut tracking-[-0.005em] border-b border-brass-soft pb-1 mb-2">
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function RowFreeform({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-1.5">
      <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-brass-deep mb-1">
        {label}
      </div>
      {value.trim().length > 0 ? (
        <p className="font-serif text-[14px] text-walnut whitespace-pre-wrap leading-snug m-0">
          {value}
        </p>
      ) : (
        <div className="flex flex-col gap-3.5 mt-1">
          <span className="print-blank block w-full" />
          <span className="print-blank block w-full" />
        </div>
      )}
    </div>
  );
}
