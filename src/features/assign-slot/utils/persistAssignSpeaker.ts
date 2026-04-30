import { createSpeaker, updateSpeaker } from "@/features/speakers/utils/speakerActions";
import type { NonMeetingSunday, SpeakerRole } from "@/lib/types";

export interface AssignSpeakerInput {
  wardId: string;
  date: string;
  /** Existing speaker doc id, or `null` to create a new one. */
  speakerId: string | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
  name: string;
  topic: string;
  role: SpeakerRole;
  email: string;
  phone: string;
}

/** Create or update the speaker doc for a per-row assign step.
 *  Returns the resolved speaker id (a fresh one for create mode,
 *  echoes the input id for edit mode). Empty contact fields write as
 *  empty strings rather than being stripped — this matches the
 *  wizard's behavior where the bishop can clear an existing email by
 *  blanking the field. */
export async function persistAssignSpeaker(input: AssignSpeakerInput): Promise<string> {
  if (input.speakerId === null) {
    return createSpeaker({
      wardId: input.wardId,
      date: input.date,
      nonMeetingSundays: input.nonMeetingSundays,
      name: input.name.trim(),
      role: input.role,
      ...(input.topic.trim() ? { topic: input.topic.trim() } : {}),
      ...(input.email.trim() ? { email: input.email.trim() } : {}),
      ...(input.phone.trim() ? { phone: input.phone.trim() } : {}),
    });
  }
  await updateSpeaker(input.wardId, input.date, input.speakerId, {
    name: input.name.trim(),
    topic: input.topic.trim(),
    role: input.role,
    email: input.email.trim(),
    phone: input.phone.trim(),
  });
  return input.speakerId;
}
