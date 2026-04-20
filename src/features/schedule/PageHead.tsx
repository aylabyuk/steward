import { ReactNode } from "react";

interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  rightSlot?: ReactNode;
}

export function PageHead({ eyebrow, title, subtitle, rightSlot }: Props) {
  return (
    <div className="flex items-baseline justify-between gap-4 pb-6 border-b border-border">
      <div className="flex-1 min-w-0">
        {eyebrow && <p className="text-xs uppercase tracking-widest text-walnut-3 mb-2">{eyebrow}</p>}
        <h1 className="text-4xl font-display font-semibold text-walnut mb-1">{title}</h1>
        {subtitle && <p className="text-base italic text-walnut-2">{subtitle}</p>}
      </div>
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
    </div>
  );
}
