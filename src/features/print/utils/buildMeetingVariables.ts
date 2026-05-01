import type { WithId } from "@/hooks/_sub";
import type { SacramentMeeting, Speaker, Ward } from "@/lib/types";
import { speakerTopicForDisplay } from "@/features/speakers/utils/topicDisplay";
import { formatLongDate, midLabel, orderedSpeakers, personName } from "./programData";

function speakerLabel(s: { name: string; topic: string | null }): string {
  return `${s.name} — ${speakerTopicForDisplay(s.topic)}`;
}

function hymnLabel(h: { number?: number; title?: string } | undefined): string {
  if (!h) return "";
  if (h.number && h.title) return `#${h.number} — ${h.title}`;
  return h.title ?? (h.number ? `#${h.number}` : "");
}

interface Args {
  date: string;
  meeting: SacramentMeeting | null;
  speakers: readonly WithId<Speaker>[];
  ward: Ward | null;
}

/** Resolves the runtime variable map a saved program template walks
 *  against. Mirrors `PROGRAM_VARIABLES` token-for-token; values not
 *  set on the meeting return empty strings (the renderer falls back
 *  to a placeholder chip in that case). */
export function buildMeetingVariables({
  date,
  meeting,
  speakers,
  ward,
}: Args): Record<string, string> {
  const list = orderedSpeakers(speakers);
  const m = meeting;
  return {
    // Meeting metadata
    date: formatLongDate(date),
    wardName: ward?.name ?? "",
    meetingType: "Regular",
    // Leadership
    presiding: personName(m?.presiding),
    conducting: personName(m?.conducting),
    chorister: personName(m?.chorister),
    pianist: personName(m?.pianist),
    // Hymns
    openingHymn: hymnLabel(m?.openingHymn),
    sacramentHymn: hymnLabel(m?.sacramentHymn),
    closingHymn: hymnLabel(m?.closingHymn),
    // Speakers
    speaker1: list[0] ? speakerLabel(list[0]) : "",
    speaker2: list[1] ? speakerLabel(list[1]) : "",
    speaker3: list[2] ? speakerLabel(list[2]) : "",
    speaker4: list[3] ? speakerLabel(list[3]) : "",
    midMeetingInterlude: midLabel(m?.mid) ?? "",
    // Free-form
    openingPrayer: personName(m?.openingPrayer),
    benediction: personName(m?.benediction),
    visitors: (m?.visitors ?? [])
      .filter((v) => v.name.trim().length > 0)
      .map((v) => (v.details ? `${v.name} — ${v.details}` : v.name))
      .join(", "),
    announcements: m?.announcements ?? "",
    wardBusiness: m?.wardBusiness ?? "",
    stakeBusiness: m?.stakeBusiness ?? "",
  };
}
