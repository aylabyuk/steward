import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type SpeakerEmailTemplate, type SpeakerLetterTemplate, speakerSchema } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { DEFAULT_SPEAKER_EMAIL_BODY } from "./speakerEmailDefaults";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "./speakerLetterDefaults";
import { clearSpeakerEmailOverride, saveSpeakerEmailOverride } from "./speakerEmailOverride";
import { clearSpeakerLetterOverride, saveSpeakerLetterOverride } from "./speakerLetterOverride";

interface Args {
  wardId: string;
  date: string;
  speakerId: string;
  open: boolean;
  letterTemplate: SpeakerLetterTemplate | null;
  emailTemplate: SpeakerEmailTemplate | null;
}

/**
 * Hydration + persistence helpers for `PrepareInvitationDialog`. Holds
 * the letter + email editor state, tracks whether a per-speaker
 * override currently exists, and exposes save / clear handlers. The
 * dialog owns the action orchestration (Send / Print / Mark invited);
 * this hook only manages the Firestore-facing state.
 */
export function usePrepareInvitation(args: Args) {
  const { wardId, date, speakerId, open, letterTemplate, emailTemplate } = args;
  const [letterBody, setLetterBody] = useState("");
  const [letterFooter, setLetterFooter] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [letterHasOverride, setLetterHasOverride] = useState(false);
  const [emailHasOverride, setEmailHasOverride] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const snap = await getDoc(doc(db, "wards", wardId, "meetings", date, "speakers", speakerId));
      if (cancelled) return;
      const parsed = snap.exists() ? speakerSchema.safeParse(snap.data()) : null;
      const letterOverride = parsed?.success ? parsed.data.letterOverride : undefined;
      const emailOverride = parsed?.success ? parsed.data.emailOverride : undefined;
      setLetterBody(
        letterOverride?.bodyMarkdown ?? letterTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY,
      );
      setLetterFooter(
        letterOverride?.footerMarkdown ??
          letterTemplate?.footerMarkdown ??
          DEFAULT_SPEAKER_LETTER_FOOTER,
      );
      setEmailBody(
        emailOverride?.bodyMarkdown ?? emailTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_EMAIL_BODY,
      );
      setLetterHasOverride(Boolean(letterOverride));
      setEmailHasOverride(Boolean(emailOverride));
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, wardId, date, speakerId, letterTemplate, emailTemplate]);

  async function persistOverrides() {
    await Promise.all([
      saveSpeakerLetterOverride(wardId, date, speakerId, {
        bodyMarkdown: letterBody,
        footerMarkdown: letterFooter,
      }),
      saveSpeakerEmailOverride(wardId, date, speakerId, { bodyMarkdown: emailBody }),
    ]);
    setLetterHasOverride(true);
    setEmailHasOverride(true);
  }

  function revertLetterToWardDefault() {
    setLetterBody(letterTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY);
    setLetterFooter(letterTemplate?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER);
  }

  function revertEmailToWardDefault() {
    setEmailBody(emailTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_EMAIL_BODY);
  }

  async function clearLetterOverride() {
    setBusy(true);
    setError(null);
    try {
      await clearSpeakerLetterOverride(wardId, date, speakerId);
      revertLetterToWardDefault();
      setLetterHasOverride(false);
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setBusy(false);
    }
  }

  async function clearEmailOverride() {
    setBusy(true);
    setError(null);
    try {
      await clearSpeakerEmailOverride(wardId, date, speakerId);
      revertEmailToWardDefault();
      setEmailHasOverride(false);
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setBusy(false);
    }
  }

  return {
    letterBody,
    letterFooter,
    emailBody,
    setLetterBody,
    setLetterFooter,
    setEmailBody,
    letterHasOverride,
    emailHasOverride,
    error,
    busy,
    setBusy,
    setError,
    persistOverrides,
    revertLetterToWardDefault,
    revertEmailToWardDefault,
    clearLetterOverride,
    clearEmailOverride,
  };
}
