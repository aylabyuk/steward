import type { SpeakerRole, SpeakerStatus } from "@/lib/types";

export interface Draft {
  id: string | null;
  tempId: string;
  name: string;
  email: string;
  topic: string;
  role: SpeakerRole;
  status: SpeakerStatus;
}

export function emptyDraft(): Draft {
  return {
    id: null,
    tempId: `new-${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    email: "",
    topic: "",
    role: "Member",
    status: "planned",
  };
}

export function fromSpeaker(id: string, s: {
  name: string;
  email?: string;
  topic?: string;
  status: SpeakerStatus;
  role: SpeakerRole;
}): Draft {
  return {
    id,
    tempId: `p-${id}`,
    name: s.name,
    email: s.email ?? "",
    topic: s.topic ?? "",
    role: s.role,
    status: s.status,
  };
}

export function isDirty(draft: Draft, original: Draft | null): boolean {
  if (!original) return true;
  return (
    draft.name !== original.name ||
    draft.email !== original.email ||
    draft.topic !== original.topic ||
    draft.role !== original.role ||
    draft.status !== original.status
  );
}
