import type { Ref } from "react";
import type { Hymn } from "@/lib/types";
import { cn } from "@/lib/cn";
import { ChevronDown, ClearIcon } from "./HymnPickerIcons";

interface Props {
  triggerRef: Ref<HTMLButtonElement>;
  hymn: Hymn | null | undefined;
  open: boolean;
  placeholder: string;
  onOpen: () => void;
  onClear: () => void;
}

/** The collapsed "picker" button. Extracted so HymnPicker stays under the
 *  150-LOC ceiling — all its logic (listeners, search, keyboard nav) lives
 *  in the parent. */
export function HymnPickerTrigger({ triggerRef, hymn, open, placeholder, onOpen, onClear }: Props) {
  const hasValue = Boolean(hymn?.number);
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={onOpen}
      className={cn(
        "w-full grid grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 px-3 py-1.5 rounded-md border cursor-pointer transition-colors text-left",
        open
          ? "border-bordeaux bg-chalk shadow-[0_0_0_2px_rgba(139,46,42,0.12)]"
          : "border-border bg-parchment hover:border-border-strong hover:bg-chalk",
      )}
    >
      {hasValue && hymn ? (
        <>
          <span className="font-mono text-[13px] font-semibold text-bordeaux-deep tracking-[0.04em] min-w-7">
            {hymn.number}
          </span>
          <span className="font-serif text-[14.5px] text-walnut truncate">{hymn.title}</span>
          <span
            role="button"
            aria-label="Clear hymn"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="w-5 h-5 inline-flex items-center justify-center rounded-full text-walnut-3 hover:bg-parchment-2 hover:text-bordeaux"
          >
            <ClearIcon />
          </span>
        </>
      ) : (
        <span className="col-span-3 font-serif italic text-[14px] text-walnut-3">
          {placeholder}
        </span>
      )}
      <ChevronDown />
    </button>
  );
}
