import { ReactNode } from "react";

interface Props {
  id?: string;
  label: string;
  count?: number;
  helper?: ReactNode;
  rightSlot?: ReactNode;
  children: ReactNode;
}

/**
 * White card container used for each Program subsection (Leaders, Prayers,
 * Music, Sacrament, Speakers, Hymns, Announcements, Comments).
 */
export function ProgramSection({ id, label, count, helper, rightSlot, children }: Props) {
  return (
    <section id={id} className="bg-chalk border border-border rounded-xl p-5 mb-4 scroll-mt-22.5">
      <div className="flex items-center gap-2.5 mb-3.5">
        <span className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep">
          {label}
        </span>
        {count != null && (
          <span className="font-mono text-[10px] tracking-[0.08em] text-walnut-3 px-2 py-0.5 border border-border rounded-full bg-parchment">
            {count}
          </span>
        )}
        {helper && <span className="ml-auto inline-flex items-center gap-2">{helper}</span>}
        {rightSlot}
      </div>
      {children}
    </section>
  );
}
