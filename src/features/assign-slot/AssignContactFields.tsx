import { PrayerPlanField } from "./PrayerPlanField";

interface Props {
  email: string;
  phone: string;
  emailInvalid: boolean;
  phoneInvalid: boolean;
  disabled: boolean;
  emailPlaceholder: string;
  onEmailChange: (v: string) => void;
  onPhoneChange: (v: string) => void;
}

/** Email + phone pair shared by speaker and prayer assign forms.
 *  Both inputs honor `disabled` so the locked-state form (status
 *  past "planned") becomes read-only. */
export function AssignContactFields({
  email,
  phone,
  emailInvalid,
  phoneInvalid,
  disabled,
  emailPlaceholder,
  onEmailChange,
  onPhoneChange,
}: Props) {
  return (
    <>
      <PrayerPlanField
        label="Email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={onEmailChange}
        placeholder={emailPlaceholder}
        invalid={emailInvalid}
        disabled={disabled}
        {...(emailInvalid ? { hint: "Doesn't look like a valid email." } : {})}
      />
      <PrayerPlanField
        label="Phone"
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={phone}
        onChange={onPhoneChange}
        placeholder="+1 555 555 1234"
        invalid={phoneInvalid}
        disabled={disabled}
        {...(phoneInvalid ? { hint: "Use international format, e.g. +14165551234." } : {})}
      />
    </>
  );
}
