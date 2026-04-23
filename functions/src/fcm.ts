import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import type { FcmToken } from "./types.js";

/** Display payload for a user-visible push. Title/body ride inside
 *  `data` (not the top-level `notification` field) so the SW's
 *  `onBackgroundMessage` handler is always invoked and can call
 *  `showNotification()` itself. iOS Safari PWAs (16.4+) silently drop
 *  pushes that aren't displayed inside the SW push event, and the
 *  Firebase JS SDK's auto-display path (triggered by a `notification`
 *  field) doesn't reliably satisfy that contract on iOS. Going
 *  data-only routes every platform through the same explicit
 *  `showNotification()` call.
 *
 *  `Urgency: high` keeps APNs/FCM from coalescing the push as
 *  background priority — required when the payload has no
 *  `notification` field. */
export interface DisplayPush {
  title: string;
  body: string;
  data: Record<string, string>;
}

export async function sendDisplayPush(
  wardId: string,
  tokensByUid: ReadonlyMap<string, readonly FcmToken[]>,
  push: DisplayPush,
): Promise<SendOutcome> {
  return sendAndPrune(wardId, tokensByUid, {
    data: { ...push.data, title: push.title, body: push.body },
    webpush: { headers: { Urgency: "high" } },
  });
}

// Token errors that indicate the device unsubscribed or the token is invalid.
// Anything else (server error, throttling) is transient — keep the token.
const DEAD_TOKEN_CODES = new Set<string>([
  "messaging/registration-token-not-registered",
  "messaging/invalid-registration-token",
  "messaging/invalid-argument",
]);

export interface SendOutcome {
  successCount: number;
  failureCount: number;
  deadTokens: string[];
}

/**
 * Sends `payload` to every token across `tokensByUid`. Any tokens flagged as
 * dead are pruned from the corresponding member doc atomically per-uid.
 */
export async function sendAndPrune(
  wardId: string,
  tokensByUid: ReadonlyMap<string, readonly FcmToken[]>,
  payload: Omit<MulticastMessage, "tokens">,
): Promise<SendOutcome> {
  const flat: { uid: string; token: string }[] = [];
  for (const [uid, tokens] of tokensByUid) {
    for (const t of tokens) flat.push({ uid, token: t.token });
  }
  if (flat.length === 0) {
    return { successCount: 0, failureCount: 0, deadTokens: [] };
  }

  const response = await getMessaging().sendEachForMulticast({
    ...payload,
    tokens: flat.map((f) => f.token),
  });

  const deadByUid = new Map<string, Set<string>>();
  response.responses.forEach((resp, idx) => {
    if (resp.success) return;
    const code = resp.error?.code ?? "";
    if (!DEAD_TOKEN_CODES.has(code)) return;
    const entry = flat[idx];
    if (!entry) return;
    const set = deadByUid.get(entry.uid) ?? new Set<string>();
    set.add(entry.token);
    deadByUid.set(entry.uid, set);
  });

  const allDead: string[] = [];
  await Promise.all(
    [...deadByUid.entries()].map(([uid, dead]) => {
      const tokens = tokensByUid.get(uid) ?? [];
      const kept = tokens.filter((t) => !dead.has(t.token));
      for (const tok of dead) allDead.push(tok);
      return getFirestore().doc(`wards/${wardId}/members/${uid}`).update({ fcmTokens: kept });
    }),
  );

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    deadTokens: allDead,
  };
}
