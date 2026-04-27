import { isPlausiblePhone } from "@/features/templates/utils/smsInvitation";
import { isValidEmail } from "@/lib/email";
import type { Speaker } from "@/lib/types";

export interface SendValidation {
  email: string;
  hasEmail: boolean;
  canSend: boolean;
  canSendReason: string | null;
  canSms: boolean;
  canSmsReason: string | null;
}

/** Per-speaker send-readiness flags + user-facing copy explaining
 *  why a channel is unavailable. The reason strings pivot on what
 *  other channels are actually available so we never suggest "text"
 *  when there's no phone or "email" when there's no address. Keeps
 *  the Prepare route body small enough to fit the 150-LOC ceiling. */
export function computeSendValidation(speaker: Speaker): SendValidation {
  const email = (speaker.email ?? "").trim();
  const hasEmail = email.length > 0;
  const emailValid = isValidEmail(email);
  const canSend = hasEmail && emailValid;
  const phone = (speaker.phone ?? "").trim();
  const canSms = isPlausiblePhone(phone);
  const canSendReason = canSendHint({ hasEmail, emailValid, canSms });
  const canSmsReason = canSmsHint({ canSend, canSms, hasPhone: phone.length > 0 });
  return { email, hasEmail, canSend, canSendReason, canSms, canSmsReason };
}

function canSendHint(args: {
  hasEmail: boolean;
  emailValid: boolean;
  canSms: boolean;
}): string | null {
  if (!args.hasEmail) {
    return args.canSms
      ? "No email on file — text, print, or mark invited instead."
      : "No email or phone on file — print the invitation or mark invited.";
  }
  if (!args.emailValid) return "Invalid email format.";
  return null;
}

function canSmsHint(args: { canSend: boolean; canSms: boolean; hasPhone: boolean }): string | null {
  if (args.canSend || args.canSms) return null;
  if (!args.hasPhone) return "No phone on file.";
  return null;
}
