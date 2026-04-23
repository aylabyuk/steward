import { formatShortDate } from "./dateFormat";

interface Props {
  date: string;
  reason?: string;
}

/** Muted card rendered in place of the full Sunday card when the
 *  meeting has been cancelled. Extracted from SundayCard to keep
 *  that file under the 150-LOC ceiling. */
export function SundayCardCancelled({ date, reason }: Props): React.ReactElement {
  return (
    <article className="rounded-lg border border-border bg-chalk p-4 shadow-elev-1">
      <p className="text-lg font-semibold text-walnut line-through">{formatShortDate(date)}</p>
      <p className="text-xs font-mono tracking-wider text-walnut-3 mt-1">Cancelled</p>
      {reason && <p className="text-sm text-walnut-2 mt-2">{reason}</p>}
    </article>
  );
}
