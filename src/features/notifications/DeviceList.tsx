import { useState } from "react";
import type { Timestamp } from "firebase/firestore";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import type { FcmToken } from "@/lib/types";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { unsubscribeDevice } from "./fcmToken";

const PLATFORM_LABELS: Record<FcmToken["platform"], string> = {
  web: "Web",
  ios: "iOS",
  android: "Android",
};

function formatTime(at: unknown): string {
  if (at && typeof at === "object" && "toDate" in (at as object)) {
    return (at as Timestamp).toDate().toLocaleString();
  }
  return "";
}

export function DeviceList() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUser = useAuthStore((s) => s.user);
  const me = useCurrentMember();
  const [busyToken, setBusyToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!wardId || !authUser || !me) return null;
  const tokens = me.data.fcmTokens ?? [];

  async function remove(token: FcmToken) {
    if (!wardId || !authUser) return;
    setBusyToken(token.token);
    setError(null);
    try {
      await unsubscribeDevice({ wardId, uid: authUser.uid, token });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyToken(null);
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-sm font-semibold text-slate-700">Subscribed devices</h2>
      {tokens.length === 0 && <p className="text-xs text-slate-500">No devices subscribed yet.</p>}
      {tokens.length > 0 && (
        <ul className="flex flex-col divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {tokens.map((t) => (
            <li key={t.token} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
              <div className="min-w-0">
                <div className="font-medium text-slate-800">{PLATFORM_LABELS[t.platform]}</div>
                <div className="truncate text-slate-500">Added {formatTime(t.updatedAt)}</div>
              </div>
              <button
                type="button"
                onClick={() => void remove(t)}
                disabled={busyToken === t.token}
                className="rounded-md border border-slate-300 px-2 py-1 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {busyToken === t.token ? "Removing…" : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </section>
  );
}
