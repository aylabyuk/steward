import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { DevModeSection } from "@/features/profile/DevModeSection";
import { IdentitySection } from "@/features/profile/IdentitySection";
import { PageRail } from "@/components/ui/PageRail";
import { SaveBar } from "@/components/ui/SaveBar";
import { SessionSection } from "@/features/profile/SessionSection";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { isDevModeEmail } from "@/stores/devModeStore";

interface Draft {
  displayName: string;
}

const RAIL_ITEMS = [
  { id: "sec-identity", label: "Profile" },
  { id: "sec-session", label: "Session" },
];
const RAIL_ITEMS_DEV = [...RAIL_ITEMS, { id: "sec-dev", label: "Developer" }];

const RAIL_ELSEWHERE = [
  { to: "/settings/notifications", label: "Notifications" },
  { to: "/settings/ward", label: "Ward settings" },
];

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Profile page — identity + session. Notifications moved to their own
 *  page (`/settings/notifications`) so the device toggle and quiet
 *  hours have a dedicated surface from the user menu. */
export function ProfilePage(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUser = useAuthStore((s) => s.user);
  const me = useCurrentMember();

  const source = useMemo<Draft | null>(() => {
    if (!me) return null;
    return { displayName: me.data.displayName };
  }, [me]);

  const [draft, setDraft] = useState<Draft | null>(source);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    setDraft(source);
  }, [source]);

  if (!wardId || !authUser || !me || !draft || !source) {
    return (
      <main className="pb-24">
        <p className="font-serif italic text-[14px] text-walnut-2">Loading your profile…</p>
      </main>
    );
  }

  const dirty = draft.displayName !== source.displayName;

  async function save() {
    if (!draft || !me || !wardId) return;
    setSaving(true);
    setError(null);
    try {
      await updateDoc(doc(db, "wards", wardId, "members", me.id), {
        displayName: draft.displayName.trim() || me.data.displayName,
        updatedAt: serverTimestamp(),
      });
      setSavedAt(nowLabel());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setDraft(source);
    setError(null);
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
          Profile
        </h1>
        <p className="font-serif italic text-[16px] text-walnut-2 mt-1">
          Your name and how you appear to other bishopric members.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-8 items-start">
        <div>
          <IdentitySection
            uid={authUser.uid}
            email={authUser.email ?? ""}
            displayName={draft.displayName}
            photoURL={authUser.photoURL ?? me.data.photoURL ?? null}
            onDisplayNameChange={(displayName) => setDraft({ ...draft, displayName })}
          />
          <SessionSection />
          {isDevModeEmail(authUser.email) && <DevModeSection />}
        </div>

        <PageRail
          items={isDevModeEmail(authUser.email) ? RAIL_ITEMS_DEV : RAIL_ITEMS}
          elsewhere={RAIL_ELSEWHERE}
        />
      </div>

      <SaveBar
        dirty={dirty}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </main>
  );
}
