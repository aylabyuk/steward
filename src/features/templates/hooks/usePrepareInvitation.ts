import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type SpeakerLetterTemplate, speakerSchema } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { legacyFieldsFromState } from "@/features/page-editor/utils/serializeForInterpolation";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "../utils/speakerLetterDefaults";
import { clearSpeakerLetterOverride, saveSpeakerLetterOverride } from "../utils/speakerLetterOverride";

interface Args {
  wardId: string;
  date: string;
  speakerId: string;
  open: boolean;
  letterTemplate: SpeakerLetterTemplate | null;
}

interface InitialMarkdown {
  bodyMarkdown: string;
  footerMarkdown: string;
}

/**
 * Hydration + persistence helpers for the wizard's per-speaker letter
 * override. Holds the editor state as a Lexical JSON string and
 * exposes save / clear handlers. The dialog owns the action
 * orchestration (Send / Print / Mark invited); this hook only manages
 * the Firestore-facing state.
 *
 * Read precedence: override.editorStateJson → ward template
 * editorStateJson → ward template legacy markdown → app defaults. The
 * hook also derives `letterBody` / `letterFooter` from the current
 * JSON via `legacyFieldsFromState` so the existing send/print
 * pipelines (which still take markdown) keep working unchanged.
 */
export function usePrepareInvitation(args: Args) {
  const { wardId, date, speakerId, open, letterTemplate } = args;
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [initialMarkdown, setInitialMarkdown] = useState<InitialMarkdown>({
    bodyMarkdown: DEFAULT_SPEAKER_LETTER_BODY,
    footerMarkdown: DEFAULT_SPEAKER_LETTER_FOOTER,
  });
  const [letterStateJson, setLetterStateJson] = useState<string | null>(null);
  const [letterHasOverride, setLetterHasOverride] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setHydrated(false);
    (async () => {
      const snap = await getDoc(doc(db, "wards", wardId, "meetings", date, "speakers", speakerId));
      if (cancelled) return;
      const parsed = snap.exists() ? speakerSchema.safeParse(snap.data()) : null;
      const override = parsed?.success ? parsed.data.letterOverride : undefined;
      const json = override?.editorStateJson ?? letterTemplate?.editorStateJson ?? null;
      const md: InitialMarkdown = {
        bodyMarkdown:
          override?.bodyMarkdown ?? letterTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY,
        footerMarkdown:
          override?.footerMarkdown ??
          letterTemplate?.footerMarkdown ??
          DEFAULT_SPEAKER_LETTER_FOOTER,
      };
      setInitialJson(json);
      setInitialMarkdown(md);
      setLetterStateJson(json);
      setLetterHasOverride(Boolean(override));
      setError(null);
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, wardId, date, speakerId, letterTemplate]);

  const { letterBody, letterFooter } = useMemo(() => {
    if (!letterStateJson) {
      return {
        letterBody: initialMarkdown.bodyMarkdown,
        letterFooter: initialMarkdown.footerMarkdown,
      };
    }
    try {
      const state = JSON.parse(letterStateJson);
      const fields = legacyFieldsFromState(state);
      return { letterBody: fields.bodyMarkdown, letterFooter: fields.footerMarkdown };
    } catch {
      return {
        letterBody: initialMarkdown.bodyMarkdown,
        letterFooter: initialMarkdown.footerMarkdown,
      };
    }
  }, [letterStateJson, initialMarkdown]);

  function captureInitial(json: string) {
    setLetterStateJson(json);
    setInitialJson((prev) => prev ?? json);
  }

  async function persistOverrides() {
    if (!letterStateJson) return;
    await saveSpeakerLetterOverride(wardId, date, speakerId, { editorStateJson: letterStateJson });
    setLetterHasOverride(true);
  }

  function revertLetterToWardDefault() {
    setLetterStateJson(letterTemplate?.editorStateJson ?? null);
    setInitialJson(letterTemplate?.editorStateJson ?? null);
    setInitialMarkdown({
      bodyMarkdown: letterTemplate?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY,
      footerMarkdown: letterTemplate?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER,
    });
    setResetKey((k) => k + 1);
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
    initialJson,
    initialMarkdown,
    letterStateJson,
    setLetterStateJson,
    captureInitial,
    letterBody,
    letterFooter,
    letterHasOverride,
    hydrated,
    resetKey,
    error,
    busy,
    setBusy,
    setError,
    persistOverrides,
    revertLetterToWardDefault,
    clearLetterOverride,
  };
}
