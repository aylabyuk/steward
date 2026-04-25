import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { interpolate } from "@/features/templates/interpolate";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "@/features/templates/speakerLetterDefaults";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { writeSpeakerLetterTemplate } from "@/features/templates/writeSpeakerLetterTemplate";
import { SpeakerLetterPanel } from "@/features/speaker-letter-template/SpeakerLetterPanel";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";

const PREVIEW_VARS = {
  speakerName: "Sebastian Tan",
  topic: "Repentance",
  date: "Sunday, April 26, 2026",
  today: "April 21, 2026",
  inviterName: "Bishop Paul",
};

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Standalone speaker-letter template editor — Lexical-powered, in
 *  parity with the sacrament-meeting program template page. Loads the
 *  ward template; falls back to the system defaults so a brand-new
 *  ward sees a sensible printed letter. SaveBar handles persist /
 *  discard / status. */
export function SpeakerLetterTemplatePage(): React.ReactElement {
  useFullViewportLayout();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useSpeakerLetterTemplate();

  const [body, setBody] = useState(DEFAULT_SPEAKER_LETTER_BODY);
  const [footer, setFooter] = useState(DEFAULT_SPEAKER_LETTER_FOOTER);
  const [savedBody, setSavedBody] = useState(DEFAULT_SPEAKER_LETTER_BODY);
  const [savedFooter, setSavedFooter] = useState(DEFAULT_SPEAKER_LETTER_FOOTER);
  const [usingDefault, setUsingDefault] = useState(true);
  const [seeded, setSeeded] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (loading || seeded) return;
    if (template) {
      setBody(template.bodyMarkdown);
      setFooter(template.footerMarkdown);
      setSavedBody(template.bodyMarkdown);
      setSavedFooter(template.footerMarkdown);
      setUsingDefault(false);
    }
    setSeeded(true);
  }, [loading, seeded, template]);

  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  const renderedBody = useMemo(
    () => interpolate(body, { ...PREVIEW_VARS, wardName }),
    [body, wardName],
  );
  const renderedFooter = useMemo(
    () => interpolate(footer, { ...PREVIEW_VARS, wardName }),
    [footer, wardName],
  );

  const dirty = body !== savedBody || footer !== savedFooter;

  async function save() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeSpeakerLetterTemplate(wardId, { bodyMarkdown: body, footerMarkdown: footer });
      setSavedBody(body);
      setSavedFooter(footer);
      setUsingDefault(false);
      setSavedAt(nowLabel());
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setBody(savedBody);
    setFooter(savedFooter);
    setResetKey((k) => k + 1);
    setError(null);
  }

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PrintOnlyLetter
        wardName={wardName}
        assignedDate={PREVIEW_VARS.date}
        today={PREVIEW_VARS.today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
      />
      <header className="shrink-0 border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to="/schedule"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
          >
            ← Schedule
          </Link>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
            Speaker invitation letter
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.close()}
          className="shrink-0 rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut-2 hover:bg-parchment-2"
        >
          Close
        </button>
      </header>

      <SpeakerLetterPanel
        wardName={wardName}
        sampleDate={PREVIEW_VARS.date}
        sampleToday={PREVIEW_VARS.today}
        body={body}
        footer={footer}
        renderedBody={renderedBody}
        renderedFooter={renderedFooter}
        canEdit={canEdit}
        usingDefault={usingDefault}
        resetKey={resetKey}
        onBodyChange={setBody}
        onFooterChange={setFooter}
      />

      <SaveBar
        dirty={dirty && canEdit}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </main>
  );
}
