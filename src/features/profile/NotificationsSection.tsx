import { useState } from "react";
import { subscribeDevice, unsubscribeDevice } from "@/features/notifications/fcmToken";
import { useCurrentDeviceToken } from "@/features/notifications/useCurrentDeviceToken";
import type { FcmToken, NotificationPrefs } from "@/lib/types";
import { CategoryRowsComingSoon, DigestSelectComingSoon } from "./ComingSoonRows";
import { DeviceRow } from "./DeviceRow";
import { QuietHoursControl } from "./QuietHoursControl";
import { Switch } from "./Switch";

interface Props {
  wardId: string;
  uid: string;
  tokens: readonly FcmToken[];
  prefs: NotificationPrefs;
  onPrefsChange: (next: NotificationPrefs) => void;
}

/** Profile → Notifications section: disabled category rows + digest,
 *  live devices list + push toggle + quiet-hours block. Categories
 *  and digest are "Coming soon" pending their backend follow-ups. */
export function NotificationsSection({
  wardId,
  uid,
  tokens,
  prefs,
  onPrefsChange,
}: Props): React.ReactElement {
  const [busy, setBusy] = useState<string | "subscribe" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentToken = useCurrentDeviceToken(tokens);

  const deviceSubscribed = tokens.length > 0;

  async function togglePush(next: boolean) {
    setBusy("subscribe");
    setError(null);
    try {
      if (next) {
        const result = await subscribeDevice({ wardId, uid });
        if (!result) {
          setError("Enable notifications in your browser or OS, then try again.");
        }
      } else {
        for (const t of tokens) {
          await unsubscribeDevice({ wardId, uid, token: t });
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function removeOne(token: FcmToken) {
    setBusy(token.token);
    setError(null);
    try {
      await unsubscribeDevice({ wardId, uid, token });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <section
      id="sec-notifications"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        Alerts
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">Notifications</h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        Choose what you want to be notified about, and how.
      </p>

      <div className="flex flex-col gap-2 py-3 border-b border-dashed border-border">
        <div className="font-sans text-[13.5px] font-semibold text-walnut">
          What to notify me about
        </div>
        <CategoryRowsComingSoon />
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-y-2 sm:gap-x-6 py-3.5 border-b border-dashed border-border">
        <label className="font-sans text-[13.5px] font-semibold text-walnut pt-1.5">
          Email digest
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            Summary of upcoming Sundays and pending items.
          </span>
        </label>
        <DigestSelectComingSoon />
      </div>

      <div className="flex flex-col gap-2 py-3.5 border-b border-dashed border-border">
        <div className="font-sans text-[13.5px] font-semibold text-walnut">
          Subscribed devices
          <span className="block font-serif italic text-[13px] text-walnut-3 font-normal mt-0.5">
            Push notifications are sent to these browsers and phones.
          </span>
        </div>
        {tokens.length === 0 ? (
          <p className="font-serif italic text-[13px] text-walnut-3">
            No devices registered — enable push notifications to subscribe this one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tokens.map((t) => (
              <DeviceRow
                key={t.token}
                token={t}
                isCurrentDevice={t.token === currentToken}
                busy={busy === t.token}
                onRemove={() => void removeOne(t)}
              />
            ))}
          </ul>
        )}
      </div>

      <div className="grid sm:grid-cols-[200px_1fr] gap-y-2 sm:gap-x-6 py-3.5 border-b border-dashed border-border">
        <label className="font-sans text-[13.5px] font-semibold text-walnut pt-1.5">
          Push notifications
        </label>
        <div>
          <Switch
            checked={deviceSubscribed}
            onChange={(v) => void togglePush(v)}
            label="Receive push notifications on this device"
            description="Enabling will prompt your browser for permission."
            disabled={busy === "subscribe"}
          />
          {error && <p className="font-sans text-[12px] text-bordeaux mt-2">{error}</p>}
        </div>
      </div>

      <QuietHoursControl prefs={prefs} onPrefsChange={onPrefsChange} />
    </section>
  );
}
