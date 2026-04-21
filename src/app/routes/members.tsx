import { useState } from "react";
import { Link } from "react-router";
import { AddMemberDialog } from "@/features/settings/AddMemberDialog";
import { MemberList } from "@/features/settings/MemberList";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useCurrentWardStore } from "@/stores/currentWardStore";

export function MembersPage() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const { data: members, loading } = useWardMembers();
  const [addOpen, setAddOpen] = useState(false);
  const canEdit = me?.data.role === "bishopric" && me.data.active;

  return (
    <main className="max-w-3xl mx-auto pb-12">
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
            onClick={() => setAddOpen(true)}
            className="rounded-md bg-walnut px-3 py-1 text-sm text-white"
          >
            Add member
          </button>
        )}
      </header>
      {loading && <p className="text-sm text-walnut-2">Loading…</p>}
      {!loading && wardId && (
        <MemberList wardId={wardId} members={members} canEdit={Boolean(canEdit)} />
      )}
      {!canEdit && !loading && (
        <p className="mt-3 text-xs text-walnut-2">Only bishopric members can edit the roster.</p>
      )}
      {wardId && (
        <AddMemberDialog wardId={wardId} open={addOpen} onClose={() => setAddOpen(false)} />
      )}
    </main>
  );
}
