import type { ReactNode } from "react";

interface Props {
  title: string;
  count: number;
  children: ReactNode;
}

export function QuarterSection({ title, count, children }: Props) {
  return (
    <section className="mb-10">
      <div className="flex items-baseline gap-3.5 mb-4">
        <h2 className="font-display font-semibold text-walnut text-3xl tracking-[-0.01em]">
          {title}
        </h2>
        <span className="ml-auto font-mono uppercase text-[10.5px] tracking-[0.12em] text-walnut-3">
          {count} Sundays
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-4.5">{children}</div>
    </section>
  );
}
