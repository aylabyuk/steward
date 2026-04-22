import type { Calling } from "@/lib/types";
import { CALLING_OPTIONS } from "../settings/callingLabels";
import { INVITE_INPUT_CLS, InviteField } from "./inviteFormField";

interface Props {
  email: string;
  setEmail: (v: string) => void;
  displayName: string;
  setDisplayName: (v: string) => void;
  calling: Calling;
  setCalling: (v: Calling) => void;
}

/** Stacked email / display-name / calling inputs for the Invite Member
 *  dialog. Extracted so the dialog stays under the 150-LOC ceiling. */
export function InviteMemberFields({
  email,
  setEmail,
  displayName,
  setDisplayName,
  calling,
  setCalling,
}: Props) {
  return (
    <>
      <InviteField label="Email">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={INVITE_INPUT_CLS}
          placeholder="name@example.com"
        />
      </InviteField>
      <InviteField label="Display name">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={INVITE_INPUT_CLS}
          placeholder="Jane Doe"
        />
      </InviteField>
      <InviteField label="Calling">
        <select
          value={calling}
          onChange={(e) => setCalling(e.target.value as Calling)}
          className={INVITE_INPUT_CLS}
        >
          {CALLING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </InviteField>
    </>
  );
}
