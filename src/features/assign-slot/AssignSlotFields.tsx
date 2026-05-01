import type { SpeakerRole } from "@/lib/types";
import { SpeakerRolePicker } from "@/features/schedule/SpeakerRolePicker";
import { AssignContactFields } from "./AssignContactFields";

const INPUT_CLS =
  "font-sans text-[14px] px-3 py-2.5 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15 disabled:bg-parchment-2 disabled:text-walnut-2 disabled:cursor-not-allowed";
const LABEL_CLS = "font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium";

interface SpeakerFieldProps {
  name: string;
  topic: string;
  role: SpeakerRole;
  email: string;
  phone: string;
  emailInvalid: boolean;
  phoneInvalid: boolean;
  disabled?: boolean;
  onChange: (
    patch: Partial<{
      name: string;
      topic: string;
      role: SpeakerRole;
      email: string;
      phone: string;
    }>,
  ) => void;
}

/** Speaker-mode fields: name (required), topic, role, email, phone. */
export function AssignSpeakerFields({
  name,
  topic,
  role,
  email,
  phone,
  emailInvalid,
  phoneInvalid,
  disabled = false,
  onChange,
}: SpeakerFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Name <span className="text-bordeaux">*</span>
        </span>
        <input
          autoFocus={!disabled}
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Sister Hannah Reeves"
          disabled={disabled}
          className={INPUT_CLS}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Topic <span className="text-walnut-3 normal-case tracking-normal">— optional</span>
        </span>
        <input
          value={topic}
          onChange={(e) => onChange({ topic: e.target.value })}
          placeholder="e.g. On the still, small voice"
          disabled={disabled}
          className={INPUT_CLS}
        />
      </label>
      <SpeakerRolePicker
        role={role}
        readOnly={disabled}
        onChange={(next) => onChange({ role: next })}
      />
      <AssignContactFields
        email={email}
        phone={phone}
        emailInvalid={emailInvalid}
        phoneInvalid={phoneInvalid}
        disabled={disabled}
        emailPlaceholder="speaker@example.com"
        onEmailChange={(v) => onChange({ email: v })}
        onPhoneChange={(v) => onChange({ phone: v })}
      />
    </div>
  );
}

interface PrayerFieldProps {
  name: string;
  email: string;
  phone: string;
  emailInvalid: boolean;
  phoneInvalid: boolean;
  disabled?: boolean;
  onChange: (patch: Partial<{ name: string; email: string; phone: string }>) => void;
}

/** Prayer-mode fields: name (required), email, phone. Role is the
 *  route param so it doesn't appear here. */
export function AssignPrayerFields({
  name,
  email,
  phone,
  emailInvalid,
  phoneInvalid,
  disabled = false,
  onChange,
}: PrayerFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Name <span className="text-bordeaux">*</span>
        </span>
        <input
          autoFocus={!disabled}
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Brother Marcus Allen"
          disabled={disabled}
          className={INPUT_CLS}
        />
      </label>
      <AssignContactFields
        email={email}
        phone={phone}
        emailInvalid={emailInvalid}
        phoneInvalid={phoneInvalid}
        disabled={disabled}
        emailPlaceholder="prayer-giver@example.com"
        onEmailChange={(v) => onChange({ email: v })}
        onPhoneChange={(v) => onChange({ phone: v })}
      />
    </div>
  );
}
