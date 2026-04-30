import type { SystemTone } from "./utils/threadItems";

interface Props {
  body: string;
  tone: SystemTone;
}

const TONE_CLS: Record<SystemTone, { text: string; rule: string }> = {
  success: { text: "text-success", rule: "bg-success/40" },
  danger: { text: "text-bordeaux", rule: "bg-bordeaux/40" },
  neutral: { text: "text-walnut-3", rule: "bg-border" },
};

/** Centered one-line system notice for structural thread events
 *  (status changes, message deletions). Mirrors the DayDivider
 *  rule-label-rule pattern so it reads as a thread event rather
 *  than a message. Tone selects the colour pivot: success (green)
 *  for confirmed, danger (bordeaux) for declined, neutral (muted
 *  walnut) for tombstones. */
export function SystemNotice({ body, tone }: Props) {
  const { text, rule } = TONE_CLS[tone];
  return (
    <div className="flex items-center gap-2 -my-1" role="status" aria-label={body}>
      <div aria-hidden="true" className={`flex-1 h-px ${rule}`} />
      <span
        aria-hidden="true"
        className={`font-serif italic text-[12px] ${text} truncate`}
        title={body}
      >
        {body}
      </span>
      <div aria-hidden="true" className={`flex-1 h-px ${rule}`} />
    </div>
  );
}
