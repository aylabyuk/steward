import { AssignPrayerFields, AssignSpeakerFields } from "./AssignSlotFields";
import type { AssignSeed } from "./types";

interface Props {
  draft: AssignSeed;
  emailInvalid: boolean;
  phoneInvalid: boolean;
  disabled: boolean;
  onChange: (patch: Partial<AssignSeed>) => void;
}

/** Dispatch wrapper — picks the speaker or prayer field set off the
 *  draft's kind. Kept in its own file so the parent form stays under
 *  the 150-LOC cap. */
export function AssignFields({ draft, emailInvalid, phoneInvalid, disabled, onChange }: Props) {
  if (draft.kind === "speaker") {
    return (
      <AssignSpeakerFields
        name={draft.name}
        topic={draft.topic}
        role={draft.role}
        email={draft.email}
        phone={draft.phone}
        emailInvalid={emailInvalid}
        phoneInvalid={phoneInvalid}
        disabled={disabled}
        onChange={onChange}
      />
    );
  }
  return (
    <AssignPrayerFields
      name={draft.name}
      email={draft.email}
      phone={draft.phone}
      emailInvalid={emailInvalid}
      phoneInvalid={phoneInvalid}
      disabled={disabled}
      onChange={onChange}
    />
  );
}
