import { cn } from "@/lib/cn";

interface Props {
  children: React.ReactNode;
  /** Inner-row layout helper. "between" keeps Back left + primary right.
   *  "end" right-aligns one or more buttons. */
  align?: "between" | "end";
}

/** Sticky action bar pinned to the bottom of the wizard's body. The
 *  parent step is expected to be `flex flex-col` with a height that
 *  the wizard provides (h-dvh on the main); this bar is the last
 *  child and `shrink-0` so it never gets squeezed out. */
export function WizardFooter({ children, align = "between" }: Props) {
  return (
    <div className="shrink-0 border-t border-border bg-parchment px-5 sm:px-8 py-3">
      <div
        className={cn(
          "max-w-3xl w-full mx-auto flex items-center gap-2",
          align === "between" ? "justify-between" : "justify-end",
        )}
      >
        {children}
      </div>
    </div>
  );
}
