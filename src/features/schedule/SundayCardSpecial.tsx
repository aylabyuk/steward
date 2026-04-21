import { cn } from "@/lib/cn";
import type { KindVariant } from "./kindLabel";

interface Props {
  variant: KindVariant;
  stampLabel: string;
  description: string;
}

const STAMP_ICON_CLS: Record<KindVariant, string> = {
  regular: "",
  fast: "border-brass text-brass-deep bg-[rgba(224,190,135,0.2)]",
  stake: "border-bordeaux-soft text-bordeaux bg-danger-soft",
  general: "border-bordeaux-soft text-bordeaux bg-danger-soft",
};

const STAMP_LABEL_CLS: Record<KindVariant, string> = {
  regular: "",
  fast: "text-brass-deep",
  stake: "text-bordeaux",
  general: "text-bordeaux",
};

export function SundayCardSpecial({ variant, stampLabel, description }: Props) {
  return (
    <div className="px-4 pb-4">
      <div className="flex items-center gap-2.5 pt-1 pb-1">
        <span
          className={cn(
            "w-5.5 h-5.5 rounded-full border inline-flex items-center justify-center font-display text-[11px] shrink-0",
            STAMP_ICON_CLS[variant],
          )}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 2l2.39 7.36H22l-6.18 4.49L18.21 22 12 17.27 5.79 22l2.39-8.15L2 9.36h7.61z" />
          </svg>
        </span>
        <span
          className={cn(
            "font-mono text-[10.5px] uppercase tracking-[0.14em]",
            STAMP_LABEL_CLS[variant],
          )}
        >
          {stampLabel}
        </span>
      </div>
      <p className="font-serif italic text-[13.5px] text-walnut-2 leading-[1.5] mt-1.5">
        {description}
      </p>
    </div>
  );
}
