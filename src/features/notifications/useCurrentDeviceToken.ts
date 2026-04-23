import { useEffect, useState } from "react";
import { readCurrentDeviceToken } from "./fcmToken";

/** Resolves the FCM token registered on this browser/PWA right now.
 *  Returns null while pending, or if no token is registered (permission
 *  denied, SW not installed, etc). The `tokens` input re-triggers the
 *  lookup after subscribe/unsubscribe so the "This device" chip can
 *  follow state changes. */
export function useCurrentDeviceToken(tokens: readonly { token: string }[]): string | null {
  const [current, setCurrent] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void readCurrentDeviceToken().then((token) => {
      if (!cancelled) setCurrent(token);
    });
    return () => {
      cancelled = true;
    };
    // Re-run when the token set changes — after subscribe, the new token
    // is in `tokens` and we want the chip to light up without a reload.
  }, [tokens]);
  return current;
}
