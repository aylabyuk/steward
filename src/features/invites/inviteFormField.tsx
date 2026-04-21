import type { ReactNode } from "react";

export const INVITE_INPUT_CLS =
  "w-full rounded-md border border-border-strong bg-chalk px-2.5 py-2 font-sans text-[13.5px] text-walnut placeholder:text-walnut-3 placeholder:italic focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15";

export function InviteField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-brass-deep">
        {label}
      </span>
      {children}
    </label>
  );
}
