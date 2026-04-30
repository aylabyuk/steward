import type { SpeakerRole } from "@/lib/types";
import { SpeakerRolePicker } from "@/features/schedule/SpeakerRolePicker";
import { PrayerPlanField } from "./PrayerPlanField";

const INPUT_CLS =
  "font-sans text-[14px] px-3 py-2.5 bg-chalk border border-border-strong rounded-md text-walnut w-full transition-colors placeholder:text-walnut-3 focus:outline-none focus:border-bordeaux focus:ring-2 focus:ring-bordeaux/15";
const LABEL_CLS = "font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep font-medium";

interface SpeakerFieldProps {
  name: string;
  topic: string;
  role: SpeakerRole;
  email: string;
  phone: string;
  emailInvalid: boolean;
  phoneInvalid: boolean;
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
  onChange,
}: SpeakerFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Name <span className="text-bordeaux">*</span>
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Sister Hannah Reeves"
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
          className={INPUT_CLS}
        />
      </label>
      <SpeakerRolePicker
        role={role}
        readOnly={false}
        onChange={(next) => onChange({ role: next })}
      />
      <PrayerPlanField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(v) => onChange({ email: v })}
        placeholder="speaker@example.com"
        invalid={emailInvalid}
        {...(emailInvalid ? { hint: "Doesn't look like a valid email." } : {})}
      />
      <PrayerPlanField
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(v) => onChange({ phone: v })}
        placeholder="+1 555 555 1234"
        invalid={phoneInvalid}
        {...(phoneInvalid ? { hint: "Use international format, e.g. +14165551234." } : {})}
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
  onChange,
}: PrayerFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className={LABEL_CLS}>
          Name <span className="text-bordeaux">*</span>
        </span>
        <input
          autoFocus
          value={name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="e.g. Brother Marcus Allen"
          className={INPUT_CLS}
        />
      </label>
      <PrayerPlanField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(v) => onChange({ email: v })}
        placeholder="prayer-giver@example.com"
        invalid={emailInvalid}
        {...(emailInvalid ? { hint: "Doesn't look like a valid email." } : {})}
      />
      <PrayerPlanField
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={(v) => onChange({ phone: v })}
        placeholder="+1 555 555 1234"
        invalid={phoneInvalid}
        {...(phoneInvalid ? { hint: "Use international format, e.g. +14165551234." } : {})}
      />
    </div>
  );
}
