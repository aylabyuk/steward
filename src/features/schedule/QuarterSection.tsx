import { ReactNode } from "react";

interface Props {
  title: string;
  count: number;
  children: ReactNode;
}

export function QuarterSection({ title, count, children }: Props) {
  return (
    <section className="mb-8">
      <div className="mb-4">
        <h2 className="text-2xl font-display font-semibold text-walnut">{title}</h2>
        <p className="text-sm text-walnut-2">{count} Sundays</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">{children}</div>
    </section>
  );
}
