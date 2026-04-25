import { cn } from "@/lib/cn";

export type LetterViewMode = "edit" | "preview";

interface Props {
  value: LetterViewMode;
  onChange: (next: LetterViewMode) => void;
  className?: string;
}

const TAB_BASE =
  "flex-1 px-3 py-2 font-sans text-[13px] font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-bordeaux/30";

export function EditPreviewToggle({ value, onChange, className }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Letter view"
      className={cn(
        "inline-flex w-full rounded-md border border-border-strong bg-parchment-2 p-0.5",
        className,
      )}
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "edit"}
        onClick={() => onChange("edit")}
        className={cn(
          TAB_BASE,
          "rounded-[5px]",
          value === "edit" ? "bg-chalk text-walnut shadow-elev-1" : "text-walnut-2",
        )}
      >
        Edit
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "preview"}
        onClick={() => onChange("preview")}
        className={cn(
          TAB_BASE,
          "rounded-[5px]",
          value === "preview" ? "bg-chalk text-walnut shadow-elev-1" : "text-walnut-2",
        )}
      >
        Preview
      </button>
    </div>
  );
}
