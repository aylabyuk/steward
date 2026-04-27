import { useEffect, useState } from "react";
import { readCurrentDeviceToken } from "../utils/fcmToken";

/** The FCM token subscribed on THIS browser/PWA (persisted in
 *  localStorage at subscribe time). Used by the Profile page to flag
 *  the matching `fcmTokens[]` row with a "This device" chip. The
 *  `tokens` dep re-reads after subscribe/unsubscribe so the chip
 *  follows state changes without a page reload. */
export function useCurrentDeviceToken(tokens: readonly { token: string }[]): string | null {
  const [current, setCurrent] = useState<string | null>(() => readCurrentDeviceToken());
  useEffect(() => {
    setCurrent(readCurrentDeviceToken());
  }, [tokens]);
  return current;
}
