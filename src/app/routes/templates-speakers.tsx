import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ScaledLetterPreview } from "@/features/templates/ScaledLetterPreview";
import { SpeakerLetterGuide } from "@/features/templates/SpeakerLetterGuide";
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

  // Hydrate editor state from Firestore once data lands. The editor
  // is gated on `seeded` so MDXEditor mounts with the hydrated values
  // (its `markdown` prop is initial-only; a post-mount change is
  // ignored by the editor even though React state updates correctly).
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
    <main className="pb-16">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/settings" className="hover:text-walnut">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-display text-[24px] font-semibold text-walnut">
          Speaker invitation letter
        </h1>
        <p className="font-serif text-[14px] text-walnut-2">
          The ward default. Edit the body and footer; the letterhead, date, assigned-Sunday callout,
          and signature are fixed.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
        <div key={resetKey} className="flex flex-col gap-4 min-w-0">
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canEdit || saving || !seeded}
              className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              onClick={resetToDefaults}
              disabled={!canEdit || saving || !seeded}
              className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
            >
              Reset to defaults
            </button>
          </div>
        </div>
        <aside className="flex flex-col gap-2 min-w-0 lg:sticky lg:top-24 lg:self-start">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Preview — 8.5 × 11 in · sample data
          </div>
          <ScaledLetterPreview
            wardName={wardName}
            assignedDate={PREVIEW_VARS.date}
            today={PREVIEW_VARS.today}
            bodyMarkdown={renderedBody}
            footerMarkdown={renderedFooter}
            maxH="calc(100dvh - 9rem)"
          />
        </aside>
      </div>
    </main>
  );
}
