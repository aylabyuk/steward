import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type SpeakerLetterTemplate, speakerSchema } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "./speakerLetterDefaults";
import { clearSpeakerLetterOverride, saveSpeakerLetterOverride } from "./speakerLetterOverride";

interface Args {
  wardId: string;
  date: string;
  speakerId: string;
  open: boolean;
  letterTemplate: SpeakerLetterTemplate | null;
}

/**
 * Hydration + persistence helpers for `PrepareInvitationDialog`. Holds
 * the letter editor state, tracks whether a per-speaker override
 * currently exists, and exposes save / clear handlers. The dialog
 * owns the action orchestration (Send / Print / Mark invited); this
 * hook only manages the Firestore-facing state.
 *
 * The email body is NOT edited in the modal — the user tweaks it in
 * their mail client after Send email opens the mailto. Only the ward
 * template at `/settings/templates/speaker-email` is editable, and
 * it seeds the mailto body directly at send time.
 */
export function usePrepareInvitation(args: Args) {
  const { wardId, date, speakerId, open, letterTemplate } = args;
  const [letterBody, setLetterBody] = useState("");
  const [letterFooter, setLetterFooter] = useState("");
  const [letterHasOverride, setLetterHasOverride] = useState(false);
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
      setLetterBody(
        letterOverride?.bodyMarkdown ?? letterTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY,
      );
      setLetterFooter(
        letterOverride?.footerMarkdown ??
          letterTemplate?.footerMarkdown ??
          DEFAULT_SPEAKER_LETTER_FOOTER,
      );
      setLetterHasOverride(Boolean(letterOverride));
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, wardId, date, speakerId, letterTemplate]);

  async function persistOverrides() {
    await saveSpeakerLetterOverride(wardId, date, speakerId, {
      bodyMarkdown: letterBody,
      footerMarkdown: letterFooter,
    });
    setLetterHasOverride(true);
  }

  function revertLetterToWardDefault() {
    setLetterBody(letterTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY);
    setLetterFooter(letterTemplate?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER);
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

  return {
    letterBody,
    letterFooter,
    setLetterBody,
    setLetterFooter,
    letterHasOverride,
    error,
    busy,
    setBusy,
    setError,
    persistOverrides,
    revertLetterToWardDefault,
    clearLetterOverride,
  };
}
