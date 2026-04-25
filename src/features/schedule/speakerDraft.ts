import type { SpeakerRole, SpeakerStatus } from "@/lib/types";

export interface Draft {
  id: string | null;
  tempId: string;
  name: string;
  email: string;
  phone: string;
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
    phone: "",
    topic: "",
    role: "Member",
    status: "planned",
  };
}

export function fromSpeaker(
  id: string,
  s: {
    name: string;
    email?: string | undefined;
    phone?: string | undefined;
    topic?: string | undefined;
    status: SpeakerStatus;
    role: SpeakerRole;
  },
): Draft {
  return {
    id,
    tempId: `p-${id}`,
    name: s.name,
    email: s.email ?? "",
    phone: s.phone ?? "",
    topic: s.topic ?? "",
    role: s.role,
    status: s.status,
  };
}

/** Reflects server-driven `status` changes (step 2 sending an
 *  invitation, the chat-side status switcher, an authoritative
 *  speaker response) back onto the local draft list so the
 *  step-1 cards don't show a stale pill. Other fields are left
 *  alone — overwriting them would clobber a bishop's in-progress
 *  text edits in step 1. The `originals` map is mutated so
 *  isDirty() doesn't flag the post-sync status as a pending
 *  user change. */
export function syncStatusFromLive(
  drafts: readonly Draft[],
  liveSpeakers: readonly { id: string; data: { status: Draft["status"] } }[],
  originals: Map<string, Draft>,
): Draft[] {
  return drafts.map((d) => {
    if (!d.id) return d;
    const live = liveSpeakers.find((s) => s.id === d.id);
    if (!live || live.data.status === d.status) return d;
    const orig = originals.get(d.tempId);
    if (orig) originals.set(d.tempId, { ...orig, status: live.data.status });
    return { ...d, status: live.data.status };
  });
}

export function isDirty(draft: Draft, original: Draft | null): boolean {
  if (!original) return true;
  return (
    draft.name !== original.name ||
    draft.email !== original.email ||
    draft.phone !== original.phone ||
    draft.topic !== original.topic ||
    draft.role !== original.role ||
    draft.status !== original.status
  );
}
