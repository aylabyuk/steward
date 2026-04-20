import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function PageHead({ eyebrow, title, subtitle, rightSlot }: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-border">
      <div className="flex-1 min-w-0">
        {eyebrow && (
          <p className="text-[9.5px] uppercase tracking-[0.14em] text-brass-deep mb-2 font-medium font-mono">{eyebrow}</p>
        )}
        <h1 className="text-4xl sm:text-5xl font-display font-semibold text-walnut mb-2 leading-tight">
          {title}
        </h1>
        {subtitle && <p className="text-base italic text-walnut-2 font-serif">{subtitle}</p>}
      </div>
      {rightSlot && <div className="shrink-0 w-full sm:w-auto">{rightSlot}</div>}
    </div>
  );
}
