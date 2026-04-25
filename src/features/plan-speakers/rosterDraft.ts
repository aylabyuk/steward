import type { SpeakerRole, SpeakerStatus } from "@/lib/types";

export interface RosterDraft {
  id: string | null;
  tempId: string;
  name: string;
  topic: string;
  role: SpeakerRole;
  status: SpeakerStatus;
  email: string;
  phone: string;
}

export function emptyDraft(): RosterDraft {
  return {
    id: null,
    tempId: `new-${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    topic: "",
    role: "Member",
    status: "planned",
    email: "",
    phone: "",
  };
}

export function fromSpeaker(
  id: string,
  s: {
    name: string;
    topic?: string | undefined;
    role: SpeakerRole;
    status: SpeakerStatus;
    email?: string | undefined;
    phone?: string | undefined;
  },
): RosterDraft {
  return {
    id,
    tempId: `p-${id}`,
    name: s.name,
    topic: s.topic ?? "",
    role: s.role,
    status: s.status,
    email: s.email ?? "",
    phone: s.phone ?? "",
  };
}

export function isDirty(draft: RosterDraft, original: RosterDraft | null): boolean {
  if (!original) return true;
  return (
    draft.name.trim() !== original.name.trim() ||
    draft.topic !== original.topic ||
    draft.role !== original.role
  );
}
