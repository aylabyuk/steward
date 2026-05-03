import type { SpeakerRole, SpeakerStatus } from "@/lib/types";

export type AssignAction = "save-and-continue" | "save-as-planned";

export interface AssignSpeakerSeed {
  kind: "speaker";
  /** Existing speaker doc id when editing. `null` for new. */
  speakerId: string | null;
  name: string;
  topic: string;
  role: SpeakerRole;
  email: string;
  phone: string;
  /** Status of an existing speaker — drives the delete confirm
   *  dialog's invited/confirmed warning. */
  status: SpeakerStatus;
}

export interface AssignPrayerSeed {
  kind: "prayer";
  name: string;
  email: string;
  phone: string;
  /** Status of the prayer-giver — drives the field-locking rule
   *  (anything other than "planned" locks all inputs). */
  status: SpeakerStatus;
}

export type AssignSeed = AssignSpeakerSeed | AssignPrayerSeed;
