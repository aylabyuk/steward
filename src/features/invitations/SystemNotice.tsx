interface Props {
  body: string;
  status: "confirmed" | "declined";
}

/** Centered one-line system notice for status-change messages,
 *  mirroring the DayDivider rule-label-rule pattern so it reads as
 *  a thread event rather than a message. Text + rule colour pivot
 *  on status: green for confirmed, red for declined. */
export function SystemNotice({ body, status }: Props) {
  const textCls = status === "confirmed" ? "text-success" : "text-bordeaux";
  const ruleCls = status === "confirmed" ? "bg-success/40" : "bg-bordeaux/40";
  return (
    <div className="flex items-center gap-2 -my-1" role="status" aria-label={body}>
      <div aria-hidden="true" className={`flex-1 h-px ${ruleCls}`} />
      <span
        aria-hidden="true"
        className={`font-serif italic text-[12px] ${textCls} truncate`}
        title={body}
      >
        {body}
      </span>
      <div aria-hidden="true" className={`flex-1 h-px ${ruleCls}`} />
    </div>
  );
}
