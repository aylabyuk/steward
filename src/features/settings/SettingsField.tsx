import type { ReactNode } from "react";

interface Props {
  label: string;
  error?: string | undefined;
  children: ReactNode;
}

export function SettingsField({ label, error, children }: Props) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      {children}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}
