import { getFirestore } from "firebase-admin/firestore";
import { getMessaging, type MulticastMessage } from "firebase-admin/messaging";
import type { FcmToken } from "./types.js";

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
  for (const [uid, dead] of deadByUid) {
    const tokens = tokensByUid.get(uid) ?? [];
    const kept = tokens.filter((t) => !dead.has(t.token));
    await getFirestore()
      .doc(`wards/${wardId}/members/${uid}`)
      .update({ fcmTokens: kept });
    for (const tok of dead) allDead.push(tok);
  }

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    deadTokens: allDead,
  };
}
