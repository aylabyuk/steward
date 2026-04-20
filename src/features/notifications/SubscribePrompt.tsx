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
      <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
        <div className="flex-1">
          <p className="font-medium">Install Steward to enable push notifications</p>
          <p className="mt-1 text-xs">
            iOS only delivers Web Push to apps installed on your home screen. Tap the Share button
            in Safari and choose "Add to Home Screen", then open Steward from the icon.
          </p>
        </div>
        <button
          type="button"
          onClick={dismissIosNudge}
          className="text-xs text-amber-800 underline"
        >
          Not now
        </button>
      </div>
    );
  }

  return (
    <div className="mb-4 flex items-start gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
      <div className="flex-1">
        <p className="font-medium text-slate-800">Get notified about program updates</p>
        <p className="mt-1 text-xs text-slate-600">
          Push notifications cover comments, change alerts, and finalization nudges.
        </p>
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={() => void subscribe()}
          disabled={busy}
          className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white disabled:opacity-50"
        >
          {busy ? "Subscribing…" : "Enable"}
        </button>
        <button type="button" onClick={dismissPrompt} className="text-xs text-slate-500 underline">
          Not now
        </button>
      </div>
    </div>
  );
}
