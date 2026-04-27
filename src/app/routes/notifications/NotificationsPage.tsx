import { useEffect, useMemo, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { AppBar } from "@/components/ui/AppBar";
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
      <>
        <AppBar eyebrow="Your account" title="Notifications" />
        <main className="w-full max-w-380 mx-auto px-4 sm:px-8 py-6 pb-24">
          <p className="font-serif italic text-[14px] text-walnut-2">Loading notifications…</p>
        </main>
      </>
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
    <>
      <AppBar
        eyebrow="Your account"
        title="Notifications"
        description="Choose what you want to be notified about, and how Steward reaches you."
      />
      <main className="w-full max-w-380 mx-auto px-4 sm:px-8 py-6 pb-24">
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
    </>
  );
}
