import { cn } from "@/lib/cn";

interface Props {
  onClick: () => void;
  icon?: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

/** Shared button used by the planned-speaker action strip. Extracted
 *  so `SpeakerInviteAction.tsx` stays under the 150-LOC ceiling. */
export function InviteActionBtn({ onClick, icon, primary, disabled, children }: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "font-sans text-[12.5px] font-semibold px-3 py-1.5 rounded-md border inline-flex items-center gap-1.5 transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed",
        primary
          ? "bg-bordeaux text-parchment border-bordeaux-deep hover:bg-bordeaux-deep shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:hover:bg-bordeaux"
          : "bg-chalk text-walnut border-border-strong hover:bg-parchment-2 disabled:hover:bg-chalk",
      )}
    >
      {icon}
      {children}
    </button>
  );
}
