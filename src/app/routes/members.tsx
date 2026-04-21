import { useState } from "react";
import { Link } from "react-router";
import { InviteMemberDialog } from "@/features/invites/InviteMemberDialog";
import { PendingInvitesList } from "@/features/invites/PendingInvitesList";
import { MemberList } from "@/features/settings/MemberList";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";

export function MembersPage() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const ward = useWardSettings();
  const { data: members, loading } = useWardMembers();
  const [inviteOpen, setInviteOpen] = useState(false);
  const canEdit = me?.data.role === "bishopric" && me.data.active;

  return (
    <main className="pb-12">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/settings" className="hover:text-walnut">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-walnut">Members</h1>
          <p className="text-sm text-walnut-2">
            Manage callings, deactivate roster, and toggle email CC for clerks.
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={() => setInviteOpen(true)}
            className="rounded-md bg-walnut px-3 py-1 text-sm text-white"
          >
            Invite member
          </button>
        )}
      </header>
      {wardId && <PendingInvitesList wardId={wardId} canEdit={Boolean(canEdit)} />}
      {loading && <p className="text-sm text-walnut-2">Loading…</p>}
      {!loading && wardId && (
        <MemberList wardId={wardId} members={members} canEdit={Boolean(canEdit)} />
      )}
      {!canEdit && !loading && (
        <p className="mt-3 text-xs text-walnut-2">Only bishopric members can edit the roster.</p>
      )}
      {wardId && (
        <InviteMemberDialog
          wardId={wardId}
          ward={ward.data}
          inviter={me ? { uid: me.id, displayName: me.data.displayName } : null}
          open={inviteOpen}
          onClose={() => setInviteOpen(false)}
        />
      )}
    </main>
  );
}
