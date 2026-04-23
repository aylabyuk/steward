import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { renderSpeakerEmailBody } from "./renderSpeakerEmailBody";
import { DEFAULT_SPEAKER_EMAIL_BODY } from "./speakerEmailDefaults";
import { EditorSection } from "./SpeakerLetterEditor";
import { useSpeakerEmailTemplate } from "./useSpeakerEmailTemplate";
import { writeSpeakerEmailTemplate } from "./writeSpeakerEmailTemplate";

const SAMPLE_URL = "https://example.com/invite/speaker/your-ward/sample-token";

/** Templates → Speaker invitation email section. Plain-text message
 *  your mail client sends from the speaker's row. Distinct from the
 *  letter embedded on the landing page (separate editor, new tab). */
export function SpeakerEmailSection(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useSpeakerEmailTemplate();

  const [body, setBody] = useState(DEFAULT_SPEAKER_EMAIL_BODY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);

  useEffect(() => {
    if (loading || seeded) return;
    if (template) setBody(template.bodyMarkdown);
    setSeeded(true);
  }, [loading, seeded, template]);

  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  const preview = useMemo(
    () =>
      renderSpeakerEmailBody(
        {
          speakerName: "Brother Lloyd Flores",
          date: "Sunday, April 26, 2026",
          wardName: wardName || "Your Ward",
          inviterName: me?.data.displayName ?? "Bishop",
          topic: "repentance and the grace of Christ",
          inviteUrl: SAMPLE_URL,
        },
        { override: body, template: null },
      ),
    [body, wardName, me?.data.displayName],
  );

  async function handleSave() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeSpeakerEmailTemplate(wardId, { bodyMarkdown: body });
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="sec-speaker-email"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        Template
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Speaker invitation email
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        The plain-text message your email client sends when you click "Send email" on a planned
        speaker. Variables: <code>{"{{speakerName}}"}</code>, <code>{"{{date}}"}</code>,{" "}
        <code>{"{{wardName}}"}</code>, <code>{"{{inviterName}}"}</code>, <code>{"{{topic}}"}</code>,{" "}
        <code>{"{{inviteUrl}}"}</code>.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <EditorSection
            label="Email body"
            initialMarkdown={body}
            onChange={setBody}
            disabled={!canEdit}
          />
          {error && <p className="font-sans text-[12.5px] text-bordeaux">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!canEdit || saving}
              className="font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-walnut bg-walnut text-parchment hover:bg-ink shadow-[0_1px_0_rgba(35,24,21,0.18)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              onClick={() => setBody(DEFAULT_SPEAKER_EMAIL_BODY)}
              disabled={!canEdit || saving}
              className="font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-60"
            >
              Reset to default
            </button>
          </div>
        </div>
        <aside className="flex flex-col gap-2 min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Preview — sample data
          </div>
          <pre className="rounded-md border border-border bg-parchment-2/60 p-4 font-serif text-[13px] text-walnut-2 leading-relaxed whitespace-pre-wrap break-words">
            {preview}
          </pre>
        </aside>
      </div>
    </section>
  );
}
