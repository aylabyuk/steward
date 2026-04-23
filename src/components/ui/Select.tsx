import { forwardRef } from "react";
import { cn } from "@/lib/cn";

/** App-standard `<select>` styling: parchment background, walnut ink,
 *  bordeaux focus ring, and a custom brass caret replacing the
 *  browser's native arrow so dropdowns on Ward Settings / Profile
 *  all read as one family. */
const CARET = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'><path d='M1 1l4 4 4-4' stroke='%238A7460' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")`;

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "ref">;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      {...rest}
      style={{
        backgroundImage: CARET,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 10px center",
        ...rest.style,
      }}
      className={cn(
        "appearance-none cursor-pointer font-sans text-[14px] pl-2.5 pr-8 py-1.5 bg-parchment border border-border rounded-md text-walnut transition-colors",
        "hover:border-border-strong hover:bg-chalk",
        "focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        className,
      )}
    >
      {children}
    </select>
  ),
);
Select.displayName = "Select";
