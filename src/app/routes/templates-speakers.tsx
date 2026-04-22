import { useEffect, useMemo, useState } from "react";
import { MobileLetterPreviewButton } from "@/features/templates/MobileLetterPreviewButton";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { SpeakerLetterGuide } from "@/features/templates/SpeakerLetterGuide";
import { EditorSection } from "@/features/templates/SpeakerLetterEditor";
import { SpeakerLetterTemplateHeader } from "./SpeakerLetterTemplateHeader";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "@/features/templates/speakerLetterDefaults";
import { interpolate } from "@/features/templates/interpolate";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { writeSpeakerLetterTemplate } from "@/features/templates/writeSpeakerLetterTemplate";
import { WardTemplateToolbar } from "@/features/templates/WardTemplateToolbar";
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

  const toolbarProps = {
    canEdit,
    busy: saving || !seeded,
    saving,
    onSave: () => void handleSave(),
    onReset: resetToDefaults,
  };

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <SpeakerLetterTemplateHeader
        canEdit={canEdit}
        busy={saving || !seeded}
        saving={saving}
        onSave={() => void handleSave()}
        onReset={resetToDefaults}
        onClose={() => window.close()}
      />

      <div className="flex-1 min-h-0 lg:overflow-hidden px-4 sm:px-8 pt-5 pb-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
          <div
            key={resetKey}
            className="flex flex-col gap-4 min-w-0 lg:h-[calc(100dvh-10rem)] lg:overflow-y-auto lg:pr-2"
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
          </div>
          <aside className="hidden lg:flex flex-col gap-2 min-w-0">
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
              Preview — 8.5 × 11 in · sample data
            </div>
            <div className="relative">
              <ScaledLetterPreview
                wardName={wardName}
                assignedDate={PREVIEW_VARS.date}
                today={PREVIEW_VARS.today}
                bodyMarkdown={renderedBody}
                footerMarkdown={renderedFooter}
                height="calc(100dvh - 10rem)"
              />
              <div className="absolute top-3 right-3 z-10">
                <WardTemplateToolbar {...toolbarProps} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
