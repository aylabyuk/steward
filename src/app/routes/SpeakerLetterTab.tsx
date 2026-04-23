import { useEffect, useMemo, useState } from "react";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
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
import { SpeakerLetterTemplateEditorColumn } from "./SpeakerLetterTemplateEditorColumn";

const PREVIEW_VARS = {
  speakerName: "Sebastian Tan",
  topic: "Repentance",
  date: "Sunday, April 26, 2026",
  today: "April 21, 2026",
  inviterName: "Bishop Paul",
};

/** Letter tab of the Speaker-invitation template page. Full-viewport
 *  editor + live 8.5×11 preview. Hosted inside the combined template
 *  route under appShell=false so the preview has the viewport it
 *  needs. */
export function SpeakerLetterTab(): React.ReactElement {
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
    <>
      <PrintOnlyLetter
        wardName={wardName}
        assignedDate={PREVIEW_VARS.date}
        today={PREVIEW_VARS.today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
      />
      <div className="flex-1 min-h-0 lg:overflow-hidden px-4 sm:px-8 pt-5 pb-4">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
          <SpeakerLetterTemplateEditorColumn
            resetKey={resetKey}
            body={body}
            footer={footer}
            setBody={setBody}
            setFooter={setFooter}
            canEdit={canEdit}
            seeded={seeded}
            error={error}
            wardName={wardName}
            sampleDate={PREVIEW_VARS.date}
            sampleToday={PREVIEW_VARS.today}
            renderedBody={renderedBody}
            renderedFooter={renderedFooter}
          />
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
                height="calc(100dvh - 14rem)"
              />
              <div className="absolute top-3 right-3 z-10">
                <WardTemplateToolbar {...toolbarProps} />
              </div>
            </div>
          </aside>
        </div>
        <div className="lg:hidden mt-4 flex justify-center">
          <WardTemplateToolbar {...toolbarProps} />
        </div>
      </div>
    </>
  );
}
