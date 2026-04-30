import type { WithId } from "@/hooks/_sub";
import { usePrayerParticipant } from "@/features/prayers/hooks/usePrayerParticipant";
import type { SacramentMeeting, Speaker } from "@/lib/types";
import { computeHeroSummary } from "./utils/heroSummary";
import type { KindVariant } from "./utils/kindLabel";

interface Props {
  date: string;
  variant: KindVariant;
  speakers: WithId<Speaker>[];
  meeting: SacramentMeeting | null;
}

/** Kind-aware "X of Y confirmed" rollup line shown beneath the date
 *  on the schedule's hero (first) card. Subscribes to prayer
 *  participants only when mounted, so non-hero cards don't pay for
 *  these reads. Returns nothing for stake/general (the centered stamp
 *  on the body already says "no local program"). */
export function MobileSundayHeroSummary({ date, variant, speakers, meeting }: Props) {
  const opening = usePrayerParticipant(date, "opening");
  const benediction = usePrayerParticipant(date, "benediction");

  const speakerCount = speakers.length;
  const speakerConfirmedCount = speakers.filter((s) => s.data.status === "confirmed").length;

  const openingName =
    opening.data?.name?.trim() || meeting?.openingPrayer?.person?.name?.trim() || "";
  const benedictionName =
    benediction.data?.name?.trim() || meeting?.benediction?.person?.name?.trim() || "";
  const prayerAssignedCount = (openingName ? 1 : 0) + (benedictionName ? 1 : 0);
  const prayerConfirmedCount =
    (opening.data?.status === "confirmed" ? 1 : 0) +
    (benediction.data?.status === "confirmed" ? 1 : 0);

  const summary = computeHeroSummary({
    variant,
    speakerCount,
    speakerConfirmedCount,
    prayerAssignedCount,
    prayerConfirmedCount,
  });

  if (!summary) return null;
  return <p className="font-sans text-[12.5px] text-walnut-2 mt-0.5 px-4 pb-1.5">{summary}</p>;
}
