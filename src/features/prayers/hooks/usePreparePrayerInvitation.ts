import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { type PrayerLetterTemplate, type PrayerRole, prayerParticipantSchema } from "@/lib/types";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { legacyFieldsFromState } from "@/features/page-editor/utils/serializeForInterpolation";
import {
  DEFAULT_PRAYER_LETTER_BODY,
  DEFAULT_PRAYER_LETTER_FOOTER,
} from "@/features/templates/utils/prayerLetterDefaults";
import { clearPrayerLetterOverride, savePrayerLetterOverride } from "../utils/prayerLetterOverride";

interface Args {
  wardId: string;
  date: string;
  role: PrayerRole;
  open: boolean;
  /** Ward's prayer letter template. The dedicated editor lives at
   *  `/settings/templates/prayer-letter`; until the bishop authors
   *  one this is `null` and the prepare page falls back to the
   *  hard-coded prayer defaults. */
  letterTemplate: PrayerLetterTemplate | null;
}

interface InitialMarkdown {
  bodyMarkdown: string;
  footerMarkdown: string;
}

/** Hydration + persistence helpers for the per-prayer letter
 *  override. Mirrors `usePrepareInvitation` but reads / writes the
 *  prayer participant doc at
 *  `wards/{wardId}/meetings/{date}/prayers/{role}`. */
export function usePreparePrayerInvitation(args: Args) {
  const { wardId, date, role, open, letterTemplate } = args;
  const [initialJson, setInitialJson] = useState<string | null>(null);
  const [initialMarkdown, setInitialMarkdown] = useState<InitialMarkdown>({
    bodyMarkdown: DEFAULT_PRAYER_LETTER_BODY,
    footerMarkdown: DEFAULT_PRAYER_LETTER_FOOTER,
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
      const snap = await getDoc(doc(db, "wards", wardId, "meetings", date, "prayers", role));
      if (cancelled) return;
      const parsed = snap.exists() ? prayerParticipantSchema.safeParse(snap.data()) : null;
      const override = parsed?.success ? parsed.data.letterOverride : undefined;
      const json = override?.editorStateJson ?? letterTemplate?.editorStateJson ?? null;
      const md: InitialMarkdown = {
        bodyMarkdown:
          override?.bodyMarkdown ?? letterTemplate?.bodyMarkdown ?? DEFAULT_PRAYER_LETTER_BODY,
        footerMarkdown:
          override?.footerMarkdown ??
          letterTemplate?.footerMarkdown ??
          DEFAULT_PRAYER_LETTER_FOOTER,
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
  }, [open, wardId, date, role, letterTemplate]);

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
    await savePrayerLetterOverride(wardId, date, role, { editorStateJson: letterStateJson });
    setLetterHasOverride(true);
  }

  function revertLetterToWardDefault() {
    setLetterStateJson(letterTemplate?.editorStateJson ?? null);
    setInitialJson(letterTemplate?.editorStateJson ?? null);
    setInitialMarkdown({
      bodyMarkdown: letterTemplate?.bodyMarkdown ?? DEFAULT_PRAYER_LETTER_BODY,
      footerMarkdown: letterTemplate?.footerMarkdown ?? DEFAULT_PRAYER_LETTER_FOOTER,
    });
    setResetKey((k) => k + 1);
  }

  async function clearLetterOverride() {
    setBusy(true);
    setError(null);
    try {
      await clearPrayerLetterOverride(wardId, date, role);
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
