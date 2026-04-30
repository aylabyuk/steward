import { useEffect, useState } from "react";
import { defaultMeetingType } from "@/features/meetings/utils/ensureMeetingDoc";
import type { NonMeetingSunday } from "@/lib/types";
import type { MonthGroup } from "./utils/groupByMonth";
import { JumpToHeroButton } from "./JumpToHeroButton";
import { MobileSundayBlock } from "./MobileSundayBlock";

interface Props {
  monthGroups: readonly MonthGroup[];
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

/** Mobile schedule list. The first card across all month groups gets
 *  the hero treatment (bordeaux eyebrow countdown, larger date,
 *  kind-aware confirmed-rollup line). When the hero scrolls out of
 *  view, a Messages-style floating jump-back button fades in so the
 *  bishop can return to "this Sunday" with one tap. */
export function MobileScheduleList({ monthGroups, leadTimeDays, nonMeetingSundays }: Props) {
  const firstDate = monthGroups[0]?.sundays[0]?.date ?? null;
  const [heroEl, setHeroEl] = useState<HTMLElement | null>(null);
  const [heroVisible, setHeroVisible] = useState(true);

  useEffect(() => {
    if (!heroEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHeroVisible(entry?.isIntersecting ?? false),
      { threshold: 0.1 },
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [heroEl]);

  function jumpToHero() {
    heroEl?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <>
      <div className="-mx-2 space-y-4">
        {monthGroups.flatMap((group) =>
          group.sundays.map((sunday) => {
            const isHero = sunday.date === firstDate;
            const block = (
              <MobileSundayBlock
                date={sunday.date}
                meeting={sunday.meeting}
                fallbackType={defaultMeetingType(sunday.date, nonMeetingSundays)}
                leadTimeDays={leadTimeDays}
                nonMeetingSundays={nonMeetingSundays}
                isHero={isHero}
              />
            );
            return isHero ? (
              <div key={sunday.date} ref={setHeroEl}>
                {block}
              </div>
            ) : (
              <div key={sunday.date}>{block}</div>
            );
          }),
        )}
      </div>
      <JumpToHeroButton visible={Boolean(firstDate) && !heroVisible} onJump={jumpToHero} />
    </>
  );
}
