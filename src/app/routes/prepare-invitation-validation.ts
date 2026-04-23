import { isPlausiblePhone } from "@/features/templates/smsInvitation";
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
 *  why a channel is unavailable. Keeps the Prepare route body small
 *  enough to fit the 150-LOC ceiling. */
export function computeSendValidation(speaker: Speaker): SendValidation {
  const email = (speaker.email ?? "").trim();
  const hasEmail = email.length > 0;
  const emailValid = isValidEmail(email);
  const canSend = hasEmail && emailValid;
  const canSendReason = !hasEmail
    ? "No email on file — print, text, or mark invited instead."
    : !emailValid
      ? "Invalid email format."
      : null;
  const phone = (speaker.phone ?? "").trim();
  const canSms = isPlausiblePhone(phone);
  const canSmsReason = canSend || canSms ? null : !phone ? "No phone on file." : null;
  return { email, hasEmail, canSend, canSendReason, canSms, canSmsReason };
}
