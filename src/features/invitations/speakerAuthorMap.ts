import type { User } from "firebase/auth";
import type { AuthorInfo, AuthorMap } from "./useConversation";

interface BishopricParticipant {
  uid: string;
  displayName: string;
  role: "bishopric" | "clerk";
  email?: string | undefined;
}

interface Args {
  invitationId: string;
  speakerName: string;
  bishopricParticipants: readonly BishopricParticipant[];
  user: User | null;
  twilioIdentity: string | null;
  liveAuthors: AuthorMap;
}

/** Composes the author directory the speaker-side chat uses to label
 *  bubbles. Seeds the map from the invitation snapshot
 *  (bishopricParticipants) so names render even before Twilio streams
 *  participant attributes, then overlays the signed-in speaker's own
 *  photo/name, and finally merges in whatever Twilio actually sees. */
export function buildSpeakerAuthorMap(args: Args): AuthorMap {
  const map = new Map<string, AuthorInfo>();
  map.set(`speaker:${args.invitationId}`, {
    displayName: args.speakerName,
    role: "speaker",
  });
  for (const m of args.bishopricParticipants) {
    const info: AuthorInfo = { displayName: m.displayName, role: m.role };
    if (m.email) info.email = m.email;
    map.set(`uid:${m.uid}`, info);
  }
  if (args.user && args.twilioIdentity) {
    const existing = map.get(args.twilioIdentity);
    const info: AuthorInfo = {
      displayName: existing?.displayName ?? args.user.displayName ?? args.speakerName,
    };
    if (existing?.role) info.role = existing.role;
    if (args.user.photoURL) info.photoURL = args.user.photoURL;
    map.set(args.twilioIdentity, info);
  }
  for (const [id, info] of args.liveAuthors) {
    const existing = map.get(id);
    map.set(id, { ...existing, ...info });
  }
  return map;
}
