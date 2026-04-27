import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { NotificationsSection } from "@/features/profile/NotificationsSection";
import { SaveBar } from "@/components/ui/SaveBar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { db } from "@/lib/firebase";
import type { NotificationPrefs } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { withDefaults } from "@/features/settings/utils/notificationPrefs";

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Standalone Notifications page — moved out of Profile so the
 *  device toggle and quiet-hours controls have a dedicated surface
 *  reachable directly from the user menu. The savebar tracks the
 *  notificationPrefs draft only; subscribe / unsubscribe and device
 *  removal stay imperative inside NotificationsSection. */
export function NotificationsPage(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();

  const source = useMemo<NotificationPrefs | null>(() => {
    if (!me) return null;
    return withDefaults(me.data.notificationPrefs);
  }, [me]);

  const [draft, setDraft] = useState<NotificationPrefs | null>(source);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setDraft(source);
  }, [source]);

  if (!wardId || !me || !draft || !source) {
    return (
      <main className="pb-24">
        <p className="font-serif italic text-[14px] text-walnut-2">Loading notifications…</p>
      </main>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(source);

  async function save() {
    if (!draft || !me || !wardId) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "wards", wardId, "members", me.id), {
        notificationPrefs: draft,
        updatedAt: serverTimestamp(),
      });
      setSavedAt(nowLabel());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="pb-24">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/schedule" className="hover:text-walnut">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1.5">
          Your account
        </div>
        <h1 className="font-display text-[2.25rem] font-semibold text-walnut leading-tight">
          Notifications
        </h1>
        <p className="font-serif italic text-[16px] text-walnut-2 mt-1">
          Choose what you want to be notified about, and how Steward reaches you.
        </p>
      </header>

      <NotificationsSection
        wardId={wardId}
        uid={me.id}
        tokens={me.data.fcmTokens}
        prefs={draft}
        onPrefsChange={setDraft}
      />

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={() => {
          setDraft(source);
          setError(null);
        }}
        onSave={() => void save()}
      />
    </main>
  );
}
