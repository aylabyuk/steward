import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { speakerSchema, type SpeakerLetterTemplate } from "@/lib/types";
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
  template: SpeakerLetterTemplate | null;
  onDone: () => void;
}

/** Encapsulates the seed-from-override-or-template-or-defaults hydration,
 *  save / reset handlers, and busy / error state so the dialog itself
 *  stays focused on layout. */
export function useLetterOverrideForm(args: Args) {
  const { wardId, date, speakerId, open, template, onDone } = args;
  const [body, setBody] = useState("");
  const [footer, setFooter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasOverride, setHasOverride] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      // Re-read the speaker doc on each open so we show the latest
      // override if another session edited it.
      const snap = await getDoc(doc(db, "wards", wardId, "meetings", date, "speakers", speakerId));
      if (cancelled) return;
      const parsed = snap.exists() ? speakerSchema.safeParse(snap.data()) : null;
      const override = parsed?.success ? parsed.data.letterOverride : undefined;
      const src = override ??
        template ?? {
          bodyMarkdown: DEFAULT_SPEAKER_LETTER_BODY,
          footerMarkdown: DEFAULT_SPEAKER_LETTER_FOOTER,
        };
      setBody(src.bodyMarkdown);
      setFooter(src.footerMarkdown);
      setHasOverride(Boolean(override));
      setError(null);
    })();
    return () => {
      cancelled = true;
    };
  }, [open, wardId, date, speakerId, template]);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await saveSpeakerLetterOverride(wardId, date, speakerId, {
        bodyMarkdown: body,
        footerMarkdown: footer,
      });
      onDone();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  async function reset() {
    setSaving(true);
    setError(null);
    try {
      await clearSpeakerLetterOverride(wardId, date, speakerId);
      onDone();
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  return { body, footer, setBody, setFooter, error, saving, save, reset, hasOverride };
}
