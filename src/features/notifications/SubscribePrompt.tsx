import { useEffect, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { subscribeDevice } from "./fcmToken";
import { readBrowserContext, shouldShowIosNudge } from "./iosInstallNudge";

import { detectMode } from "./subscribeMode";

export function SubscribePrompt() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUser = useAuthStore((s) => s.user);
  const me = useCurrentMember();
  const promptDismissed = useNotificationsStore((s) => s.promptDismissed);
  const iosNudgeDismissed = useNotificationsStore((s) => s.iosNudgeDismissed);
  const dismissPrompt = useNotificationsStore((s) => s.dismissPrompt);
  const dismissIosNudge = useNotificationsStore((s) => s.dismissIosNudge);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ctx = readBrowserContext();
  const iosNeedsInstall = ctx ? shouldShowIosNudge(ctx) : false;
  const permission: NotificationPermission | "unsupported" =
    typeof Notification === "undefined" ? "unsupported" : Notification.permission;

  const mode = detectMode({
    permission,
    hasTokens: (me?.data.fcmTokens?.length ?? 0) > 0,
    promptDismissed,
    iosNudgeDismissed,
    iosNeedsInstall,
  });

  useEffect(() => {
    setError(null);
  }, [wardId]);

  if (mode === "hidden" || mode === "subscribed") return null;
  if (!wardId || !authUser) return null;

  async function subscribe() {
    if (!wardId || !authUser) return;
    setBusy(true);
    setError(null);
    try {
      const out = await subscribeDevice({ wardId, uid: authUser.uid });
      if (!out) setError("Permission denied or notifications unsupported on this device.");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (mode === "ios-nudge") {
    return (
      <div className="mb-4 rounded-lg border border-warning-soft bg-warning-soft/40 p-4 text-sm text-brass-deep">
        <p className="font-sans font-semibold text-walnut">
          Install Steward to enable push notifications
        </p>
        <p className="mt-1 text-[13px] text-walnut-2">
          iOS only delivers Web Push to apps installed on your home screen. Tap the Share button in
          Safari and choose "Add to Home Screen", then open Steward from the icon.
        </p>
        <div className="mt-3 flex items-center justify-end">
          <button
            type="button"
            onClick={dismissIosNudge}
            className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-lg border border-border bg-chalk p-4 text-sm">
      <p className="font-sans font-semibold text-walnut">Get notified about program updates</p>
      <p className="mt-1 text-[13px] text-walnut-2">
        Push notifications cover comments, change alerts, and finalization nudges.
      </p>
      {error && <p className="mt-2 text-xs text-bordeaux">{error}</p>}
      <div className="mt-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={dismissPrompt}
          className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-transparent text-walnut-2 hover:bg-parchment-2 hover:text-walnut transition-colors"
        >
          Not now
        </button>
        <button
          type="button"
          onClick={() => void subscribe()}
          disabled={busy}
          className="font-sans text-[13px] font-semibold px-3.5 py-2 rounded-md border border-bordeaux-deep bg-bordeaux text-parchment shadow-[0_1px_0_rgba(35,24,21,0.18)] hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {busy ? "Subscribing…" : "Enable"}
        </button>
      </div>
    </div>
  );
}
