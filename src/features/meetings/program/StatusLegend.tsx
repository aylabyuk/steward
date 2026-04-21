/**
 * Legend for the status-toggle icon used across Prayers/Music/Sacrament/
 * Leaders rows. Rendered once at the top of the program sections so the
 * glyphs aren't repeated in every section header.
 */
export function StatusLegend() {
  return (
    <div className="inline-flex items-center gap-5 px-3.5 py-2 rounded-lg border border-border bg-chalk">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-walnut-3">
        Status
      </span>
      <Item kind="empty" label="Empty" />
      <Item kind="unconfirmed" label="Not confirmed" />
      <Item kind="confirmed" label="Confirmed" />
    </div>
  );
}

function Item({ kind, label }: { kind: "empty" | "unconfirmed" | "confirmed"; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-walnut-3">
      <Dot kind={kind} />
      {label}
    </span>
  );
}

function Dot({ kind }: { kind: "empty" | "unconfirmed" | "confirmed" }) {
  if (kind === "confirmed") {
    return <span className="w-3 h-3 rounded-full bg-success border-[1.25px] border-success" />;
  }
  if (kind === "empty") {
    return (
      <span className="w-3 h-3 rounded-full border-[1.25px] border-dashed border-border-strong" />
    );
  }
  return <span className="w-3 h-3 rounded-full border-[1.25px] border-walnut-3" />;
}
