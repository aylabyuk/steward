import type { ReactNode } from "react";

export function EditorSection({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className ?? ""}`}
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      {children}
    </section>
  );
}

export function EditorPlaceholder({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
