import { useState } from "react";
import type { SubState } from "@/hooks/_sub";
import { DeleteSpeakerConfirm } from "@/features/speakers/DeleteSpeakerConfirm";
import { isValidEmail } from "@/lib/email";
import { isE164 } from "@/features/templates/utils/smsInvitation";
import type { Member, SpeakerRole, SpeakerStatus, WithId } from "@/lib/types";
import type { StatusSource } from "@/lib/types/meeting";
import { AssignSlotFooter } from "./AssignSlotFooter";
import { AssignPrayerFields, AssignSpeakerFields } from "./AssignSlotFields";
import { AssignSlotStatusRow } from "./AssignSlotStatusRow";

export type AssignAction = "save-and-continue" | "save-as-planned";

export interface AssignSpeakerSeed {
  kind: "speaker";
  /** Existing speaker doc id when editing. `null` for new. */
  speakerId: string | null;
  name: string;
  topic: string;
  role: SpeakerRole;
  email: string;
  phone: string;
  /** Status of an existing speaker — drives the delete confirm
   *  dialog's invited/confirmed warning. */
  status: SpeakerStatus;
}

export interface AssignPrayerSeed {
  kind: "prayer";
  name: string;
  email: string;
  phone: string;
  /** Status of the prayer-giver — drives the field-locking rule
   *  (anything other than "planned" locks all inputs). */
  status: SpeakerStatus;
}

export type AssignSeed = AssignSpeakerSeed | AssignPrayerSeed;

interface Props {
  seed: AssignSeed;
  busy: boolean;
  error: string | null;
  /** Called with the action and the current draft values. */
  onSubmit: (action: AssignAction, draft: AssignSeed) => void;
  /** Edit-mode only — both speaker and prayer pages can pass a delete
   *  handler. Prayer-mode "delete" actually unassigns the prayer-giver
   *  (the slot is intrinsic to the meeting); copy in the confirm
   *  dialog adapts via the seed's kind. */
  onDelete?: () => void;
  deleting?: boolean;
  /** Edit-mode only — when present + the assignment exists, the form
   *  renders a status menu above the fields. Flipping status fires this
   *  callback; the page persists via updateSpeaker /
   *  upsertPrayerParticipant which stamp the audit trail. */
  onStatusChange?: (next: SpeakerStatus) => void | Promise<void>;
  /** Provenance context for the status menu's friction copy. */
  currentStatusSource?: StatusSource;
  currentStatusSetBy?: string;
  members?: SubState<WithId<Member>[]>;
  currentUserUid?: string | undefined;
}

/** Per-row Assign + Invite form. One component, two kinds — speakers
 *  carry a name/topic/role/contact draft; prayers drop topic + role
 *  (the route param carries the role). Replaces the wizard's
 *  RosterRow / PrayerRosterRow editing surface for the per-slot
 *  flow. */
export function AssignSlotForm({
  seed,
  busy,
  error,
  onSubmit,
  onDelete,
  deleting,
  onStatusChange,
  currentStatusSource,
  currentStatusSetBy,
  members,
  currentUserUid,
}: Props) {
  const [draft, setDraft] = useState<AssignSeed>(seed);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Anything past "planned" is committed state — invitations sent,
  // responses recorded — so the form locks. The bishop must Remove /
  // Delete first if they need to reassign. The seed's status drives
  // this rather than draft.status (status isn't editable here, so
  // they're identical, but seeding from seed makes intent obvious).
  const locked = seed.status !== "planned";

  const emailInvalid = draft.email.trim().length > 0 && !isValidEmail(draft.email.trim());
  const phoneInvalid = draft.phone.trim().length > 0 && !isE164(draft.phone.trim());
  const nameMissing = draft.name.trim().length === 0;
  const canSubmit = !locked && !nameMissing && !emailInvalid && !phoneInvalid && !busy;

  function patch(p: Partial<AssignSeed>) {
    if (locked) return;
    setDraft((d) => ({ ...d, ...p }) as AssignSeed);
  }

  function submit(action: AssignAction) {
    if (!canSubmit) return;
    onSubmit(action, draft);
  }

  const isExistingSpeaker = draft.kind === "speaker" && draft.speakerId !== null;
  const isExistingPrayer = draft.kind === "prayer" && (locked || draft.name.trim().length > 0);
  const showDelete = Boolean(onDelete) && (isExistingSpeaker || isExistingPrayer);

  return (
    <div className="flex-1 px-4 py-6 sm:px-8 sm:py-10">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit("save-and-continue");
        }}
        className="flex flex-col gap-5 w-full max-w-xl mx-auto sm:bg-chalk sm:border sm:border-border-strong sm:rounded-[14px] sm:shadow-elev-2 sm:p-7"
      >
        {onStatusChange && (isExistingSpeaker || isExistingPrayer) && (
          <AssignSlotStatusRow
            status={seed.status}
            kind={draft.kind === "speaker" ? "speaker" : "prayer"}
            locked={locked}
            onChange={onStatusChange}
            {...(currentStatusSource ? { currentStatusSource } : {})}
            {...(currentStatusSetBy ? { currentStatusSetBy } : {})}
            {...(members ? { members } : {})}
            {...(currentUserUid !== undefined ? { currentUserUid } : {})}
          />
        )}

        {draft.kind === "speaker" ? (
          <AssignSpeakerFields
            name={draft.name}
            topic={draft.topic}
            role={draft.role}
            email={draft.email}
            phone={draft.phone}
            emailInvalid={emailInvalid}
            phoneInvalid={phoneInvalid}
            disabled={locked}
            onChange={(p) => patch(p)}
          />
        ) : (
          <AssignPrayerFields
            name={draft.name}
            email={draft.email}
            phone={draft.phone}
            emailInvalid={emailInvalid}
            phoneInvalid={phoneInvalid}
            disabled={locked}
            onChange={(p) => patch(p)}
          />
        )}

        {error && (
          <p className="font-sans text-[12.5px] text-bordeaux border border-bordeaux/40 bg-bordeaux/5 rounded-md px-3 py-2">
            {error}
          </p>
        )}

        <AssignSlotFooter
          canSubmit={canSubmit}
          busy={busy}
          showDelete={showDelete}
          deleteLabel={draft.kind === "prayer" ? "Remove" : "Delete"}
          showSaveActions={!locked}
          onDelete={() => setConfirmDelete(true)}
          onContinue={() => submit("save-and-continue")}
          onSavePlanned={() => submit("save-as-planned")}
        />

        {showDelete && onDelete && (
          <DeleteSpeakerConfirm
            open={confirmDelete}
            speakerName={draft.name}
            speakerStatus={draft.status}
            kind={draft.kind === "speaker" ? "speaker" : "prayer"}
            busy={Boolean(deleting)}
            onConfirm={() => {
              onDelete();
              setConfirmDelete(false);
            }}
            onCancel={() => setConfirmDelete(false)}
          />
        )}
      </form>
    </div>
  );
}

