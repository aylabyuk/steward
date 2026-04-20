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
      className={`rounded-lg border border-border bg-chalk p-4 shadow-sm ${className ?? ""}`}
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-walnut-2">{title}</h2>
      {children}
    </section>
  );
}

export function EditorPlaceholder({ children }: { children: ReactNode }) {
  return <p className="text-sm text-walnut-3">{children}</p>;
}
