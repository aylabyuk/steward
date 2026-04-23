import { useEffect, useMemo, useState } from "react";
import { renderSpeakerEmailBody } from "@/features/templates/renderSpeakerEmailBody";
import { DEFAULT_SPEAKER_EMAIL_BODY } from "@/features/templates/speakerEmailDefaults";
import { EditorSection } from "@/features/templates/SpeakerLetterEditor";
import { useSpeakerEmailTemplate } from "@/features/templates/useSpeakerEmailTemplate";
import { writeSpeakerEmailTemplate } from "@/features/templates/writeSpeakerEmailTemplate";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";

const SAMPLE_URL = "https://example.com/invite/speaker/your-ward/sample-token";

/** Email tab of the Speaker-invitation template page. Plain-text
 *  message for the `mailto:` flow — distinct from the letter that
 *  lands inside the speaker's invite page. */
export function SpeakerEmailTab(): React.ReactElement {
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
    <div className="px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full">
      <p className="font-serif text-[14px] text-walnut-2 mb-6">
        The plain-text message your email client sends when you click "Send email" on a planned
        speaker — distinct from the letter on the landing page. Name the Sunday and purpose here so
        the email doesn't read like a phishing link. Variables: <code>{"{{speakerName}}"}</code>,{" "}
        <code>{"{{date}}"}</code>, <code>{"{{wardName}}"}</code>, <code>{"{{inviterName}}"}</code>,{" "}
        <code>{"{{topic}}"}</code>, <code>{"{{inviteUrl}}"}</code>.
      </p>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
              className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              onClick={() => setBody(DEFAULT_SPEAKER_EMAIL_BODY)}
              disabled={!canEdit || saving}
              className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-60"
            >
              Reset to default
            </button>
          </div>
        </div>
        <aside className="flex flex-col gap-2">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Preview — sample data
          </div>
          <pre className="rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-1 font-serif text-[14px] text-walnut-2 leading-relaxed whitespace-pre-wrap break-words">
            {preview}
          </pre>
        </aside>
      </div>
    </div>
  );
}
