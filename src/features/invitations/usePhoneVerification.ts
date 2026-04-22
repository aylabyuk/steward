import { useEffect, useRef, useState } from "react";
import { RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { toE164 } from "@/features/templates/smsInvitation";

export type PhoneVerificationStep = "phone" | "code";

interface UsePhoneVerificationArgs {
  /** Set when the outer modal opens. Lets the hook reset its own
   *  state + tear down the reCAPTCHA verifier between opens. */
  open: boolean;
  defaultPhone: string | undefined;
  onVerified: () => void;
}

export interface PhoneVerificationController {
  step: PhoneVerificationStep;
  phone: string;
  setPhone: (v: string) => void;
  code: string;
  setCode: (v: string) => void;
  busy: boolean;
  error: string | null;
  sendCode: () => Promise<void>;
  verify: () => Promise<void>;
  reset: () => void;
  /** DOM ref to bind the invisible reCAPTCHA container against.
   *  Render it as `<div ref={recaptchaRef} />` somewhere in the
   *  modal body — it's visually empty but the SDK needs it. */
  recaptchaRef: React.RefObject<HTMLDivElement | null>;
}

/** Wraps Firebase Phone Auth's two-step OTP dance. Keeps the modal
 *  shell small + easy to restyle without touching auth logic. */
export function usePhoneVerification({
  open,
  defaultPhone,
  onVerified,
}: UsePhoneVerificationArgs): PhoneVerificationController {
  const [phone, setPhone] = useState(defaultPhone ?? "");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<PhoneVerificationStep>("phone");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setPhone(defaultPhone ?? "");
      setCode("");
      setStep("phone");
      setError(null);
    }
    return () => {
      verifierRef.current?.clear();
      verifierRef.current = null;
      confirmationRef.current = null;
    };
  }, [open, defaultPhone]);

  async function sendCode(): Promise<void> {
    const normalized = toE164(phone);
    if (!normalized.startsWith("+")) {
      setError("Enter your phone in international format, e.g. +14165551234.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (!verifierRef.current && recaptchaRef.current) {
        verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, {
          size: "invisible",
        });
      }
      if (!verifierRef.current) throw new Error("reCAPTCHA not ready.");
      const confirmation = await signInWithPhoneNumber(auth, normalized, verifierRef.current);
      confirmationRef.current = confirmation;
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function verify(): Promise<void> {
    const c = confirmationRef.current;
    if (!c || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await c.confirm(code.trim());
      onVerified();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function reset(): void {
    setStep("phone");
  }

  return { step, phone, setPhone, code, setCode, busy, error, sendCode, verify, reset, recaptchaRef };
}
