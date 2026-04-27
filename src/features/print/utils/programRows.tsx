import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

interface DenseProps {
  dense?: boolean;
}

export function RowLabeled({
  label,
  value,
  dense,
}: { label: string; value: string | null | undefined } & DenseProps) {
  return (
    <div
      className={cn(
        "grid items-baseline",
        dense
          ? "grid-cols-[120px_1fr] gap-4 py-1"
          : "grid-cols-[140px_1fr] gap-4 py-1.5 border-b border-dotted border-border last:border-b-0",
      )}
    >
      <span
        className={cn(
          "font-mono uppercase tracking-[0.14em] text-brass-deep",
          dense ? "text-[10px]" : "text-[10.5px]",
        )}
      >
        {label}
      </span>
      <span className={cn("font-serif text-walnut", dense ? "text-[13.5px]" : "text-[15px]")}>
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
  dense,
}: {
  label: string;
  number: number | null | undefined;
  title: string | null | undefined;
} & DenseProps) {
  const empty = !number || !title;
  return (
    <div
      className={cn(
        "grid items-baseline",
        dense
          ? "grid-cols-[120px_1fr] gap-4 py-1"
          : "grid-cols-[140px_1fr] gap-4 py-1.5 border-b border-dotted border-border last:border-b-0",
      )}
    >
      <span
        className={cn(
          "font-mono uppercase tracking-[0.14em] text-brass-deep",
          dense ? "text-[10px]" : "text-[10.5px]",
        )}
      >
        {label}
      </span>
      <span className={cn("font-serif text-walnut", dense ? "text-[13.5px]" : "text-[15px]")}>
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
export function ScriptLine({ children, dense }: { children: ReactNode } & DenseProps) {
  return (
    <p
      className={cn(
        "font-serif italic text-walnut-2 border-l-2 border-brass-soft leading-relaxed",
        dense ? "text-[12.5px] pl-3 my-2" : "text-[13.5px] pl-3 my-2.5",
      )}
    >
      {children}
    </p>
  );
}

export function RowSection({
  title,
  children,
  dense,
}: { title: string; children: ReactNode } & DenseProps) {
  return (
    <section className={dense ? "mt-2.5 mb-1" : "mt-5 mb-2"}>
      <h3
        className={cn(
          "font-display font-semibold text-walnut tracking-[-0.005em] border-b border-brass-soft",
          dense ? "text-[12.5px] pb-0.5 mb-1" : "text-[16px] pb-1 mb-2",
        )}
      >
        {title}
      </h3>
      <div className="flex flex-col">{children}</div>
    </section>
  );
}

export function RowFreeform({
  label,
  value,
  dense,
  lines,
}: { label: string; value: string; lines?: number } & DenseProps) {
  const blankCount = lines ?? (dense ? 1 : 2);
  return (
    <div className={dense ? "py-1" : "py-1.5"}>
      <div
        className={cn(
          "font-mono uppercase tracking-[0.14em] text-brass-deep",
          dense ? "text-[10px] mb-1" : "text-[10.5px] mb-1",
        )}
      >
        {label}
      </div>
      {value.trim().length > 0 ? (
        <p
          className={cn(
            "font-serif text-walnut whitespace-pre-wrap leading-relaxed m-0",
            dense ? "text-[12.5px]" : "text-[14px]",
          )}
        >
          {value}
        </p>
      ) : (
        <div className={cn("flex flex-col mt-1.5", dense ? "gap-3" : "gap-3.5")}>
          {Array.from({ length: blankCount }).map((_, i) => (
            <span key={i} className="print-blank block w-full" />
          ))}
        </div>
      )}
    </div>
  );
}
