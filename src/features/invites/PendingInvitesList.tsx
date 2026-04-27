import { useState } from "react";
import { cn } from "@/lib/cn";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { CALLING_LABELS } from "@/lib/callingLabels";
import { revokeInvite } from "./utils/inviteActions";
import { useWardInvites } from "./hooks/useWardInvites";

interface Props {
  wardId: string;
  canEdit: boolean;
}

export function PendingInvitesList({ wardId, canEdit }: Props) {
  const { data: invites, loading } = useWardInvites();
  const [error, setError] = useState<string | null>(null);
  if (loading || invites.length === 0) return null;

  async function handleRevoke(email: string) {
    setError(null);
    try {
      await revokeInvite(wardId, email);
    } catch (e) {
      setError(friendlyWriteError(e));
    }
  }

  return (
    <section className="mb-6">
      <div className="mb-2 flex items-baseline justify-between">
        <h2 className="font-display text-[17px] font-semibold text-walnut tracking-[-0.005em]">
          Pending invites
        </h2>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
          {invites.length} waiting
        </span>
      </div>
      {error && <p className="mb-2 font-sans text-[12.5px] text-bordeaux">{error}</p>}
      <ul className="flex flex-col divide-y divide-border rounded-lg border border-border bg-chalk">
        {invites.map((inv) => (
          <li key={inv.id} className="flex items-center gap-3 px-3.5 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-[13.5px] font-semibold text-walnut">
                {inv.data.displayName}
              </div>
              <div className="truncate font-sans text-[12px] text-walnut-3">
                {inv.data.email} · {CALLING_LABELS[inv.data.calling]}
              </div>
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => void handleRevoke(inv.data.email)}
                className={cn(
                  "rounded-md border border-border-strong bg-chalk px-2.5 py-1",
                  "font-sans text-[12px] font-semibold text-walnut-2 hover:bg-parchment-2 hover:text-bordeaux",
                )}
              >
                Revoke
              </button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
