import { isE164 } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";

interface RowLike {
  email: string;
  phone: string;
}

interface Validation {
  emailError: boolean;
  phoneError: boolean;
  hasError: boolean;
}

/** Empty contact stays allowed (it's optional). Errors only fire
 *  when the field is filled but doesn't pass the strict format the
 *  Twilio + SendGrid downstream expects. Mirror of the gate used by
 *  the speaker wizard's `MissingContactPrompt`. */
export function validatePrayerRow(row: RowLike): Validation {
  const email = row.email.trim();
  const phone = row.phone.trim();
  const emailError = email.length > 0 && !isValidEmail(email);
  const phoneError = phone.length > 0 && !isE164(phone);
  return { emailError, phoneError, hasError: emailError || phoneError };
}
