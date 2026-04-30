/** Display fallback when a speaker doesn't have a topic on file.
 *  Used in every UI surface that shows a speaker's topic line so the
 *  bishop sees a consistent treatment instead of "speaker has no
 *  topic" reading as a missing field. */
export const TOPIC_OF_CHOICE = "Topic of Choice";

/** Returns the trimmed topic, or the "Topic of Choice" fallback when
 *  it's empty / missing. */
export function speakerTopicForDisplay(topic: string | null | undefined): string {
  const trimmed = topic?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : TOPIC_OF_CHOICE;
}
