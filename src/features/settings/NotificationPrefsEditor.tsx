import { useEffect, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { db } from "@/lib/firebase";
import type { NotificationPrefs } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { withDefaults } from "./notificationPrefs";

async function savePrefs(wardId: string, uid: string, prefs: NotificationPrefs): Promise<void> {
  await updateDoc(doc(db, "wards", wardId, "members", uid), {
    notificationPrefs: prefs,
    updatedAt: serverTimestamp(),
  });
}

export function NotificationPrefsEditor() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (me) setPrefs(withDefaults(me.data.notificationPrefs));
  }, [me]);

  if (!wardId || !me || !prefs) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }

  const dirty = JSON.stringify(prefs) !== JSON.stringify(withDefaults(me.data.notificationPrefs));

  function setQuietHoursEnabled(on: boolean) {
    setPrefs((p) => {
      if (!p) return p;
      if (on) return { ...p, quietHours: p.quietHours ?? { startHour: 21, endHour: 7 } };
      const { quietHours: _qh, ...rest } = p;
      return rest;
    });
  }

  async function save() {
    if (!wardId || !me || !prefs) return;
    setStatus("saving");
    setError(null);
    try {
      await savePrefs(wardId, me.id, prefs);
      setStatus("saved");
    } catch (e) {
      setError((e as Error).message);
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-5"
    >
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={prefs.enabled}
          onChange={(e) => setPrefs({ ...prefs, enabled: e.target.checked })}
        />
        <span className="font-medium text-slate-700">Receive push notifications</span>
      </label>

      <fieldset className="flex flex-col gap-2 rounded-md border border-slate-200 p-3">
        <legend className="px-1 text-xs font-medium text-slate-600">Quiet hours</legend>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={Boolean(prefs.quietHours)}
            onChange={(e) => setQuietHoursEnabled(e.target.checked)}
          />
          <span>Suppress notifications during a daily window</span>
        </label>
        {prefs.quietHours && (
          <div className="flex items-center gap-2 text-sm">
            <HourSelect
              label="From"
              value={prefs.quietHours.startHour}
              onChange={(h) =>
                setPrefs({
                  ...prefs,
                  quietHours: { ...(prefs.quietHours ?? { endHour: 7 }), startHour: h },
                })
              }
            />
            <HourSelect
              label="To"
              value={prefs.quietHours.endHour}
              onChange={(h) =>
                setPrefs({
                  ...prefs,
                  quietHours: { ...(prefs.quietHours ?? { startHour: 21 }), endHour: h },
                })
              }
            />
          </div>
        )}
      </fieldset>

      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!dirty || status === "saving"}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && !dirty && <span className="text-xs text-green-700">Saved.</span>}
      </div>
    </form>
  );
}

function HourSelect({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (h: number) => void;
}) {
  return (
    <label className="flex items-center gap-1">
      <span className="text-xs text-slate-600">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
      >
        {Array.from({ length: 24 }, (_, h) => (
          <option key={h} value={h}>
            {h.toString().padStart(2, "0")}:00
          </option>
        ))}
      </select>
    </label>
  );
}
