import { useState } from "react";
import { subscribeDevice, unsubscribeDevice } from "@/features/notifications/utils/fcmToken";
import { useCurrentDeviceToken } from "@/features/notifications/hooks/useCurrentDeviceToken";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useCurrentWardStore } from "@/stores/currentWardStore";

interface PushToggle {
  ready: boolean;
  checked: boolean;
  busy: boolean;
  toggle: (next: boolean) => Promise<void>;
}

/** Subscribe/unsubscribe the *current* device for push notifications.
 *  Mirrors the imperative flow inside NotificationsSection so the
 *  user-menu quick toggle and the notifications page stay in sync —
 *  both read the same `tokens` array from the member doc and call the
 *  same FCM helpers. */
export function useDevicePushToggle(): PushToggle {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const tokens = me?.data.fcmTokens ?? [];
  const currentToken = useCurrentDeviceToken(tokens);
  const thisDevice = currentToken ? tokens.find((t) => t.token === currentToken) : undefined;
  const [busy, setBusy] = useState(false);

  const ready = Boolean(wardId && me);
  const checked = thisDevice !== undefined;

  async function toggle(next: boolean): Promise<void> {
    if (!wardId || !me || busy) return;
    setBusy(true);
    try {
      if (next) {
        await subscribeDevice({ wardId, uid: me.id });
      } else if (thisDevice) {
        await unsubscribeDevice({ wardId, uid: me.id, token: thisDevice });
      }
    } finally {
      setBusy(false);
    }
  }

  return { ready, checked, busy, toggle };
}
