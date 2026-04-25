import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { PrintOnlyLetter } from "@/features/templates/PrintOnlyLetter";
import {
  DEFAULT_SPEAKER_LETTER_BODY,
  DEFAULT_SPEAKER_LETTER_FOOTER,
} from "@/features/templates/speakerLetterDefaults";
import { useSpeakerLetterTemplate } from "@/features/templates/useSpeakerLetterTemplate";
import { writeSpeakerLetterTemplate } from "@/features/templates/writeSpeakerLetterTemplate";
import { LetterPageEditor } from "@/features/page-editor/LetterPageEditor";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";

const SAMPLE_VARS = {
  speakerName: "Sebastian Tan",
  topic: "Repentance",
  date: "Sunday, April 26, 2026",
  today: "April 21, 2026",
  inviterName: "Bishop Paul",
};

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** Speaker-letter template editor — Word-style WYSIWYG, single
 *  canvas. The editor IS the page: chrome (ornament, eyebrow, title,
 *  date) renders around the contenteditable, and the bishop authors
 *  greeting + body + assigned-Sunday callout + signature + closing
 *  scripture all in one continuous flow. SaveBar handles
 *  persist/discard/status. */
export function SpeakerLetterTemplatePage(): React.ReactElement {
  useFullViewportLayout();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useSpeakerLetterTemplate();

  const [stateJson, setStateJson] = useState<string | null>(null);
  const [savedJson, setSavedJson] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [usingDefault, setUsingDefault] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const initialMarkdown = useMemo(
    () => ({
      bodyMarkdown: template?.bodyMarkdown ?? DEFAULT_SPEAKER_LETTER_BODY,
      footerMarkdown: template?.footerMarkdown ?? DEFAULT_SPEAKER_LETTER_FOOTER,
    }),
    [template?.bodyMarkdown, template?.footerMarkdown],
  );
  const initialJson = template?.editorStateJson ?? null;

  useEffect(() => {
    if (loading || seeded) return;
    setSavedJson(initialJson);
    setStateJson(initialJson);
    setUsingDefault(!template);
    setSeeded(true);
  }, [loading, seeded, template, initialJson]);

  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  const dirty = stateJson !== savedJson && stateJson !== null;

  async function save() {
    if (!wardId || !stateJson) return;
    setSaving(true);
    setError(null);
    try {
      await writeSpeakerLetterTemplate(wardId, { editorStateJson: stateJson });
      setSavedJson(stateJson);
      setUsingDefault(false);
      setSavedAt(nowLabel());
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function discard() {
    setStateJson(savedJson);
    setEditorKey((k) => k + 1);
    setError(null);
  }

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PrintOnlyLetter
        wardName={wardName}
        assignedDate={SAMPLE_VARS.date}
        today={SAMPLE_VARS.today}
        bodyMarkdown={initialMarkdown.bodyMarkdown}
        footerMarkdown={initialMarkdown.footerMarkdown}
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
        <div className="flex items-center gap-2">
          {usingDefault && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brass-soft bg-brass-soft/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
              <span aria-hidden>★</span>
              System default — save to lock in
            </span>
          )}
          <button
            type="button"
            onClick={() => window.close()}
            className="shrink-0 rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut-2 hover:bg-parchment-2"
          >
            Close
          </button>
        </div>
      </header>

      <div className="flex-1 lg:min-h-0 overflow-y-auto bg-parchment py-8 px-4 sm:px-8 pb-24">
        {seeded && (
          <LetterPageEditor
            key={editorKey}
            wardName={wardName}
            today={SAMPLE_VARS.today}
            assignedDate={SAMPLE_VARS.date}
            initialJson={initialJson}
            initialMarkdown={initialMarkdown}
            pageStyle={template?.pageStyle ?? undefined}
            onChange={setStateJson}
            ariaLabel="Speaker invitation letter"
            editorDisabled={!canEdit}
          />
        )}
      </div>

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
