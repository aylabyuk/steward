import { useMemo } from "react";
import type { User } from "firebase/auth";
import type { WithId } from "@/hooks/_sub";
import type { Member, SpeakerInvitation } from "@/lib/types";
import type { AuthorInfo, AuthorMap } from "./useConversation";

interface Args {
  members: readonly WithId<Member>[] | undefined;
  invitation: SpeakerInvitation;
  invitationId: string;
  user: User | null;
  /** Twilio-sourced author info keyed by participant identity. Merged
   *  last so new conversations with participant attributes override
   *  the fallback map. */
  authors: AuthorMap;
}

/** Builds the author map the bishop-side thread renders with:
 *  ward-member displayNames + the speaker snapshot from the
 *  invitation + the current user's Firebase Auth photoURL, then
 *  Twilio participant attributes overlay. Old conversations without
 *  attributes still render real names that way. */
export function useBishopAuthors({
  members,
  invitation,
  invitationId,
  user,
  authors,
}: Args): AuthorMap {
  return useMemo(() => {
    const map = new Map<string, AuthorInfo>();
    for (const m of members ?? []) {
      if (m.data.role !== "bishopric" && m.data.role !== "clerk") continue;
      if (!m.data.active) continue;
      const info: AuthorInfo = { displayName: m.data.displayName, role: m.data.role };
      if (m.data.email) info.email = m.data.email;
      map.set(`uid:${m.id}`, info);
    }
    const speakerInfo: AuthorInfo = { displayName: invitation.speakerName, role: "speaker" };
    if (invitation.speakerEmail) speakerInfo.email = invitation.speakerEmail;
    if (invitation.response?.actorEmail) speakerInfo.email = invitation.response.actorEmail;
    map.set(`speaker:${invitationId}`, speakerInfo);
    if (user?.uid) {
      const existing = map.get(`uid:${user.uid}`);
      const info: AuthorInfo = {
        displayName: existing?.displayName ?? user.displayName ?? "You",
      };
      if (existing?.role) info.role = existing.role;
      if (user.photoURL) info.photoURL = user.photoURL;
      const email = existing?.email ?? user.email;
      if (email) info.email = email;
      map.set(`uid:${user.uid}`, info);
    }
    for (const [id, info] of authors) {
      const existing = map.get(id);
      map.set(id, { ...existing, ...info });
    }
    return map;
  }, [members, invitationId, invitation, user, authors]);
}
