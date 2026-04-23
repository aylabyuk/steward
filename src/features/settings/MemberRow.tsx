import { Avatar } from "@/components/ui/Avatar";
import type { WithId } from "@/hooks/_sub";
import type { Calling, Member } from "@/lib/types";
import { CALLING_OPTIONS } from "./callingLabels";
import { LastBishopricError, setActive, setCcOnEmails, updateCalling } from "./memberActions";

interface Props {
  wardId: string;
  members: readonly WithId<Member>[];
  member: WithId<Member>;
  canEdit: boolean;
  onError: (message: string) => void;
}

async function guard<T>(action: () => Promise<T>, onError: (m: string) => void): Promise<void> {
  try {
    await action();
  } catch (e) {
    onError(
      e instanceof LastBishopricError
        ? e.message
        : `Failed: ${(e as Error).message ?? "unknown error"}`,
    );
  }
}

/** Single row in the Members & callings card. Avatar + identity,
 *  calling select, CC-on-emails toggle for clerks, deactivate /
 *  reactivate button. */
export function MemberRow({
  wardId,
  members,
  member,
  canEdit,
  onError,
}: Props): React.ReactElement {
  const m = member.data;
  const avatar = {
    uid: member.id,
    displayName: m.displayName,
    photoURL: m.photoURL ?? null,
  };
  const deactivateLabel = m.active ? "Deactivate" : "Reactivate";
  const deactivateClass = m.active
    ? "border-danger-soft text-bordeaux hover:bg-danger-soft hover:border-bordeaux hover:text-bordeaux-deep"
    : "border-brass-soft text-brass-deep bg-brass-soft/20 hover:bg-brass-soft/30";

  return (
    <li className="grid sm:grid-cols-[44px_1fr_220px_auto] items-center gap-3.5 py-3.5 border-b border-dashed border-border last:border-b-0">
      <Avatar user={avatar} size="md" />
      <div className="min-w-0">
        <div className="font-sans text-[15px] font-semibold text-walnut">{m.displayName}</div>
        <div className="font-mono text-[11.5px] text-walnut-3 mt-0.5 truncate">{m.email}</div>
        {m.role === "clerk" && (
          <label className="inline-flex items-center gap-1.5 mt-2 font-serif italic text-[12.5px] text-walnut-3 cursor-pointer">
            <input
              type="checkbox"
              checked={m.ccOnEmails}
              disabled={!canEdit}
              onChange={(e) =>
                void guard(() => setCcOnEmails(wardId, member.id, e.target.checked), onError)
              }
              className="accent-bordeaux"
            />
            CC on outgoing emails
          </label>
        )}
      </div>
      <select
        value={m.calling}
        disabled={!canEdit}
        onChange={(e) =>
          void guard(
            () => updateCalling(wardId, members, member.id, e.target.value as Calling),
            onError,
          )
        }
        className="font-sans text-[14px] w-full px-2.5 py-1.5 bg-parchment border border-border rounded-md text-walnut hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15 disabled:opacity-60"
      >
        {CALLING_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        disabled={!canEdit}
        onClick={() => void guard(() => setActive(wardId, members, member.id, !m.active), onError)}
        className={`font-sans text-[12px] font-semibold px-2.5 py-1 rounded-md border transition-colors disabled:opacity-60 ${deactivateClass}`}
      >
        {deactivateLabel}
      </button>
    </li>
  );
}
