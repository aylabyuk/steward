import { Link } from "react-router";
import type { SacramentMeeting } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { KindVariant } from "./kindLabel";
import { PrayerRow } from "./PrayerRow";

interface Props {
  variant: KindVariant;
  stampLabel: string;
  description: string;
  date: string;
  meeting: SacramentMeeting | null;
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

export function SundayCardSpecial({ variant, stampLabel, description, date, meeting }: Props) {
  return (
    <div className="flex flex-1 flex-col px-4 pb-4">
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
      <p className="font-serif italic text-[13.5px] text-walnut-2 leading-[1.5] mt-1.5 mb-3">
        {description}
      </p>
      <ul className="list-none m-0 p-0 mb-2 mt-auto border-t border-border pt-1">
        <PrayerRow
          role="opening"
          date={date}
          inlineName={meeting?.openingPrayer?.person?.name ?? ""}
        />
        <PrayerRow
          role="benediction"
          date={date}
          inlineName={meeting?.benediction?.person?.name ?? ""}
        />
      </ul>
      <Link
        to={`/plan/${date}/prayers`}
        className="inline-flex items-center gap-1.5 text-[13px] font-sans font-semibold text-bordeaux hover:text-bordeaux-deep transition-colors py-1.5 md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100"
      >
        <span className="w-4 h-4 border border-bordeaux rounded-sm flex items-center justify-center">
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        Plan prayers
      </Link>
    </div>
  );
}
