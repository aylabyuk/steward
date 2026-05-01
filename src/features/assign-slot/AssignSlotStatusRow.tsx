import type { SubState } from "@/hooks/_sub";
import { SpeakerStatusMenu } from "@/features/schedule/SpeakerStatusMenu/SpeakerStatusMenu";
import type { Member, SpeakerStatus, WithId } from "@/lib/types";
import type { StatusSource } from "@/lib/types/meeting";

interface Props {
  status: SpeakerStatus;
  kind: "speaker" | "prayer";
  /** Whether the rest of the form is locked. When true, this row
   *  also renders the locked notice underneath the menu so the bishop
   *  understands why fields below are read-only. */
  locked: boolean;
  onChange: (next: SpeakerStatus) => void | Promise<void>;
  currentStatusSource?: StatusSource;
  currentStatusSetBy?: string;
  members?: SubState<WithId<Member>[]>;
  currentUserUid?: string | undefined;
}

const STATUS_LABEL: Record<SpeakerStatus, string> = {
  planned: "planned",
  invited: "invited",
  confirmed: "confirmed",
  declined: "declined",
};

/** Status row that sits above the assign form's editable fields.
 *  The menu is interactive in any state (planned / invited / confirmed /
 *  declined) — flipping back to "planned" is the bishop's way to unlock
 *  the form without going through Remove. When the form is locked, a
 *  notice underneath explains the read-only state and points to both
 *  escape hatches (change status above, or use Remove). */
export function AssignSlotStatusRow({
  status,
  kind,
  locked,
  onChange,
  currentStatusSource,
  currentStatusSetBy,
  members,
  currentUserUid,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium">
          Status
        </span>
        <SpeakerStatusMenu
          status={status}
          onChange={onChange}
          {...(currentStatusSource ? { currentStatusSource } : {})}
          {...(currentStatusSetBy ? { currentStatusSetBy } : {})}
          {...(members ? { members } : {})}
          {...(currentUserUid !== undefined ? { currentUserUid } : {})}
        />
      </div>
      {locked && <LockedNotice kind={kind} status={status} />}
    </div>
  );
}

function LockedNotice({ kind, status }: { kind: "speaker" | "prayer"; status: SpeakerStatus }) {
  const subject = kind === "prayer" ? "prayer-giver" : "speaker";
  const removeVerb = kind === "prayer" ? "Remove" : "Delete";
  return (
    <div className="rounded-md border border-brass-deep/40 bg-brass-deep/5 px-3 py-2.5 flex gap-2 items-start">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-semibold mt-0.5">
        Locked
      </span>
      <p className="font-sans text-[12.5px] text-walnut-2 leading-relaxed">
        This {subject} is{" "}
        <strong className="text-walnut font-semibold">{STATUS_LABEL[status]}</strong>. Change status
        above to unlock, or use {removeVerb} to clear the slot.
      </p>
    </div>
  );
}
