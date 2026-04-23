import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { MessageTemplateCardDesktop } from "./MessageTemplateCardDesktop";
import { MobileTemplateAccordion } from "./MobileTemplateAccordion";
import { renderSpeakerEmailBody } from "./renderSpeakerEmailBody";
import { DEFAULT_SPEAKER_EMAIL_BODY } from "./speakerEmailDefaults";
import { TemplateEditorModal } from "./TemplateEditorModal";
import { useSpeakerEmailTemplate } from "./useSpeakerEmailTemplate";
import { writeSpeakerEmailTemplate } from "./writeSpeakerEmailTemplate";

const VARIABLES = [
  { name: "speakerName", hint: "Display name from the speaker form" },
  { name: "date", hint: "Pre-formatted Sunday, e.g. 'Sunday, April 26, 2026'" },
  { name: "wardName", hint: "Your ward name" },
  { name: "inviterName", hint: "Bishop or counselor sending the invitation" },
  { name: "topic", hint: "Assigned topic (blank if absent)" },
  { name: "inviteUrl", hint: "Personal invite-page link for the speaker" },
] as const;

const SAMPLE_URL = "https://example.com/invite/speaker/your-ward/sample-token";
const DESCRIPTION =
  'The plain-text message your email client opens when you click "Send email" on a planned speaker.';

export function SpeakerEmailSection(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useSpeakerEmailTemplate();

  const [body, setBody] = useState(DEFAULT_SPEAKER_EMAIL_BODY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [bodyBeforeEdit, setBodyBeforeEdit] = useState(DEFAULT_SPEAKER_EMAIL_BODY);

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
      setEditorOpen(false);
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  function openEditor() {
    setBodyBeforeEdit(body);
    setError(null);
    setEditorOpen(true);
  }

  function cancelEditor() {
    setBody(bodyBeforeEdit);
    setEditorOpen(false);
  }

  const previewNode = (
    <aside className="flex flex-col gap-2 min-w-0">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
        Preview — sample data
      </div>
      <pre className="rounded-md border border-border bg-parchment-2/60 p-4 font-serif text-[13px] text-walnut-2 leading-relaxed whitespace-pre-wrap break-words min-h-24">
        {preview}
      </pre>
    </aside>
  );

  return (
    <>
      <MessageTemplateCardDesktop
        sectionId="sec-speaker-email"
        eyebrow="Email"
        title="Speaker invitation email"
        description={DESCRIPTION}
        variables={VARIABLES}
        editorLabel="Email body"
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={DEFAULT_SPEAKER_EMAIL_BODY}
        previewNode={previewNode}
        onBodyChange={setBody}
        onSave={handleSave}
        onReset={() => setBody(DEFAULT_SPEAKER_EMAIL_BODY)}
        className="hidden sm:block"
      />
      <MobileTemplateAccordion
        sectionId="sec-speaker-email-m"
        eyebrow="Email"
        title="Speaker invitation email"
        description={DESCRIPTION}
        preview={previewNode}
        canEdit={canEdit}
        onRequestEdit={openEditor}
        className="sm:hidden"
      />
      <TemplateEditorModal
        open={editorOpen}
        eyebrow="Email"
        title="Speaker invitation email"
        description={DESCRIPTION}
        variables={VARIABLES}
        editorLabel="Email body"
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={DEFAULT_SPEAKER_EMAIL_BODY}
        onChange={setBody}
        onSave={handleSave}
        onCancel={cancelEditor}
        onReset={() => setBody(DEFAULT_SPEAKER_EMAIL_BODY)}
      />
    </>
  );
}
