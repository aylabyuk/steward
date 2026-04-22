import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { MobileLetterPreviewButton } from "@/features/templates/MobileLetterPreviewButton";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { SpeakerLetterGuide } from "@/features/templates/SpeakerLetterGuide";
import { TemplateSaveActions } from "@/features/templates/TemplateSaveActions";
import { EditorSection } from "@/features/templates/SpeakerLetterEditor";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "@/features/templates/speakerLetterDefaults";
import { interpolate } from "@/features/templates/interpolate";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { writeSpeakerLetterTemplate } from "@/features/templates/writeSpeakerLetterTemplate";
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

export function SpeakerLetterTemplatePage() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useSpeakerLetterTemplate();

  const [body, setBody] = useState(DEFAULT_SPEAKER_LETTER_BODY);
  const [footer, setFooter] = useState(DEFAULT_SPEAKER_LETTER_FOOTER);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    if (loading || seeded) return;
    if (template) {
      setBody(template.bodyMarkdown);
      setFooter(template.footerMarkdown);
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

  async function handleSave() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeSpeakerLetterTemplate(wardId, { bodyMarkdown: body, footerMarkdown: footer });
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function resetToDefaults() {
    setBody(DEFAULT_SPEAKER_LETTER_BODY);
    setFooter(DEFAULT_SPEAKER_LETTER_FOOTER);
    setResetKey((k) => k + 1);
  }

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 flex flex-col gap-1 border-b border-border bg-chalk px-4 sm:px-8 pt-4 sm:pt-5 pb-3 sm:pb-4">
        <nav className="text-sm">
          <Link
            to="/settings"
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-bordeaux"
          >
            ← Settings
          </Link>
        </nav>
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep">
          Ward template
        </div>
        <h1 className="font-display text-[20px] sm:text-[22px] font-semibold text-walnut leading-tight">
          Speaker invitation letter
        </h1>
        <p className="font-serif italic text-[12.5px] text-walnut-3">
          The ward default — edit the body and footer; the letterhead, date, assigned-Sunday
          callout, and signature are fixed.
        </p>
      </header>

      <div className="flex-1 min-h-0 lg:overflow-hidden px-4 sm:px-8 pt-5 pb-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
          <div
            key={resetKey}
            className="flex flex-col gap-4 min-w-0 lg:h-[calc(100dvh-12rem)] lg:overflow-y-auto lg:pr-2"
          >
            <MobileLetterPreviewButton
              wardName={wardName}
              assignedDate={PREVIEW_VARS.date}
              today={PREVIEW_VARS.today}
              bodyMarkdown={renderedBody}
              footerMarkdown={renderedFooter}
            />
            <SpeakerLetterGuide />
            {seeded ? (
              <>
                <EditorSection
                  label="Letter body"
                  initialMarkdown={body}
                  onChange={setBody}
                  disabled={!canEdit}
                />
                <EditorSection
                  label="Footer (scripture)"
                  initialMarkdown={footer}
                  onChange={setFooter}
                  disabled={!canEdit}
                />
              </>
            ) : (
              <p className="font-serif italic text-[14px] text-walnut-3">Loading template…</p>
            )}
            {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
            <TemplateSaveActions
              canEdit={canEdit}
              busy={saving || !seeded}
              saving={saving}
              onSave={() => void handleSave()}
              onReset={resetToDefaults}
            />
          </div>
          <aside className="hidden lg:flex flex-col gap-2 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
              Preview — 8.5 × 11 in · sample data
            </div>
            <ScaledLetterPreview
              wardName={wardName}
              assignedDate={PREVIEW_VARS.date}
              today={PREVIEW_VARS.today}
              bodyMarkdown={renderedBody}
              footerMarkdown={renderedFooter}
              height="calc(100dvh - 12rem)"
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
