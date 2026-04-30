import { useState } from "react";
import { DeleteSpeakerConfirm } from "@/features/speakers/DeleteSpeakerConfirm";
import { isValidEmail } from "@/lib/email";
import { isE164 } from "@/features/templates/utils/smsInvitation";
import type { SpeakerRole, SpeakerStatus } from "@/lib/types";
import { AssignSlotFooter } from "./AssignSlotFooter";
import { AssignPrayerFields, AssignSpeakerFields } from "./AssignSlotFields";

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
}

export type AssignSeed = AssignSpeakerSeed | AssignPrayerSeed;

interface Props {
  seed: AssignSeed;
  busy: boolean;
  error: string | null;
  /** Called with the action and the current draft values. */
  onSubmit: (action: AssignAction, draft: AssignSeed) => void;
  /** Edit-mode only — speaker side passes a delete handler. */
  onDelete?: () => void;
  deleting?: boolean;
}

/** Per-row Assign + Invite form. One component, two kinds — speakers
 *  carry a name/topic/role/contact draft; prayers drop topic + role
 *  (the route param carries the role). Replaces the wizard's
 *  RosterRow / PrayerRosterRow editing surface for the per-slot
 *  flow. */
export function AssignSlotForm({ seed, busy, error, onSubmit, onDelete, deleting }: Props) {
  const [draft, setDraft] = useState<AssignSeed>(seed);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const emailInvalid = draft.email.trim().length > 0 && !isValidEmail(draft.email.trim());
  const phoneInvalid = draft.phone.trim().length > 0 && !isE164(draft.phone.trim());
  const nameMissing = draft.name.trim().length === 0;
  const canSubmit = !nameMissing && !emailInvalid && !phoneInvalid && !busy;

  function patch(p: Partial<AssignSeed>) {
    setDraft((d) => ({ ...d, ...p }) as AssignSeed);
  }

  function submit(action: AssignAction) {
    if (!canSubmit) return;
    onSubmit(action, draft);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit("save-and-continue");
      }}
      className="flex flex-col gap-5 max-w-xl mx-auto px-4 py-6"
    >
      {draft.kind === "speaker" ? (
        <AssignSpeakerFields
          name={draft.name}
          topic={draft.topic}
          role={draft.role}
          email={draft.email}
          phone={draft.phone}
          emailInvalid={emailInvalid}
          phoneInvalid={phoneInvalid}
          onChange={(p) => patch(p)}
        />
      ) : (
        <AssignPrayerFields
          name={draft.name}
          email={draft.email}
          phone={draft.phone}
          emailInvalid={emailInvalid}
          phoneInvalid={phoneInvalid}
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
        showDelete={Boolean(onDelete) && draft.kind === "speaker" && draft.speakerId !== null}
        onDelete={() => setConfirmDelete(true)}
        onContinue={() => submit("save-and-continue")}
        onSavePlanned={() => submit("save-as-planned")}
      />

      {draft.kind === "speaker" && draft.speakerId !== null && onDelete && (
        <DeleteSpeakerConfirm
          open={confirmDelete}
          speakerName={draft.name}
          speakerStatus={draft.status}
          busy={Boolean(deleting)}
          onConfirm={() => {
            onDelete();
            setConfirmDelete(false);
          }}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </form>
  );
}
