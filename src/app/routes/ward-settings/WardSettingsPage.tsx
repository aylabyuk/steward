import { useEffect, useState } from "react";
import { AppBar } from "@/components/ui/AppBar";
import { PageRail } from "@/components/ui/PageRail";
import { SaveBar } from "@/components/ui/SaveBar";
import { InviteMemberDialog } from "@/features/invites/InviteMemberDialog";
import { PendingInvitesList } from "@/features/invites/PendingInvitesList";
import { MembersSection } from "@/features/settings/MembersSection";
import { saveWardSettings } from "@/features/settings/utils/saveWardSettings";
import { validateWardSettings } from "@/features/settings/utils/wardSettingsValidate";
import { WardPrefsSection } from "@/features/settings/WardPrefsSection";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useWardSettings } from "@/hooks/useWardSettings";
import { type WardSettings, wardSettingsSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";

const RAIL_ELSEWHERE = [{ to: "/settings/profile", label: "Your profile" }];

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** /settings/ward — consolidated page hosting Ward preferences +
 *  Members & callings, matching the Settings.html handoff. Ward
 *  prefs flow through the savebar (explicit Save/Discard); member
 *  row edits (calling, CC, deactivate) persist imperatively per
 *  the existing pattern. */
export function WardSettingsPage() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const ward = useWardSettings();
  const { data: members, loading: membersLoading } = useWardMembers();
  const canEdit = me?.data.role === "bishopric" && me.data.active;
  const [draft, setDraft] = useState<WardSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  useEffect(() => {
    if (ward.data) setDraft(ward.data.settings);
  }, [ward.data]);

  if (!wardId || !ward.data || !draft) {
    return (
      <>
        <AppBar eyebrow="Ward administration" title="Ward settings" />
        <main className="w-full max-w-380 mx-auto px-4 sm:px-8 py-6 pb-24">
          <p className="font-serif italic text-[14px] text-walnut-2">Loading ward settings…</p>
        </main>
      </>
    );
  }

  const dirty = JSON.stringify(draft) !== JSON.stringify(ward.data.settings);
  const errors = validateWardSettings(draft);
  const hasErrors = Object.keys(errors).length > 0;

  async function save() {
    if (!wardId) return;
    const parsed = wardSettingsSchema.safeParse(draft);
    if (!parsed.success) {
      setError(parsed.error.message);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await saveWardSettings(wardId, parsed.data);
      setSavedAt(nowLabel());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    if (ward.data) setDraft(ward.data.settings);
    setError(null);
  }

  const rail = [
    { id: "sec-ward", label: "Ward preferences" },
    { id: "sec-members", label: "Members", count: members.length },
  ];

  return (
    <>
      <AppBar
        eyebrow="Ward administration"
        title="Ward settings"
        description="Preferences and member roster for the bishopric."
      />
      <main className="w-full max-w-380 mx-auto px-4 sm:px-8 py-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-8 items-start">
          <div>
            <WardPrefsSection value={draft} onChange={setDraft} canEdit={Boolean(canEdit)} />
            {!membersLoading && (
              <>
                <PendingInvitesList wardId={wardId} canEdit={Boolean(canEdit)} />
                <MembersSection
                  wardId={wardId}
                  members={members}
                  canEdit={Boolean(canEdit)}
                  onInvite={() => setInviteOpen(true)}
                />
              </>
            )}
          </div>

          <PageRail items={rail} elsewhere={RAIL_ELSEWHERE} label="Ward settings sections" />
        </div>

        <SaveBar
          dirty={dirty && !hasErrors}
          saving={saving}
          savedAt={savedAt}
          error={error ?? (hasErrors ? "Fix the highlighted fields to save." : null)}
          onDiscard={discard}
          onSave={() => void save()}
        />

        <InviteMemberDialog
          wardId={wardId}
          ward={ward.data}
          inviter={me ? { uid: me.id, displayName: me.data.displayName } : null}
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
        />
      </main>
    </>
  );
}
