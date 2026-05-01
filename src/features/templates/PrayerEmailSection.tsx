import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { MessageTemplateCardDesktop } from "./MessageTemplateCardDesktop";
import { MobileTemplateAccordion } from "./MobileTemplateAccordion";
import { interpolate } from "./utils/interpolate";
import { DEFAULT_PRAYER_EMAIL_BODY } from "./utils/prayerEmailDefaults";
import { TemplateEditorModal } from "./TemplateEditorModal";
import { usePrayerEmailTemplate } from "./hooks/usePrayerEmailTemplate";
import { writePrayerEmailTemplate } from "./utils/writePrayerEmailTemplate";

const VARIABLES = [
  { name: "speakerName", hint: "Display name of the prayer-giver" },
  { name: "date", hint: "Pre-formatted Sunday, e.g. 'Sunday, April 26, 2026'" },
  { name: "wardName", hint: "Your ward name" },
  { name: "inviterName", hint: "Bishop or counselor sending the invitation" },
  { name: "prayerType", hint: "'opening prayer' or 'closing prayer' per role" },
  { name: "inviteUrl", hint: "Personal invite-page link for the prayer-giver" },
] as const;

const SAMPLE_URL = "https://example.com/invite/speaker/your-ward/sample-token";
const DESCRIPTION =
  "The body of the invitation email prayer-givers receive when you send via email.";

export function PrayerEmailSection(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = usePrayerEmailTemplate();

  const [body, setBody] = useState(DEFAULT_PRAYER_EMAIL_BODY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [bodyBeforeEdit, setBodyBeforeEdit] = useState(DEFAULT_PRAYER_EMAIL_BODY);

  useEffect(() => {
    if (loading || seeded) return;
    if (template) setBody(template.bodyMarkdown);
    setSeeded(true);
  }, [loading, seeded, template]);

  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  const sampleVars = useMemo(
    () => ({
      speakerName: "Brother Dan Joe",
      date: "Sunday, April 26, 2026",
      wardName: wardName || "Your Ward",
      inviterName: me?.data.displayName ?? "Bishop",
      prayerType: "opening prayer",
      inviteUrl: SAMPLE_URL,
    }),
    [wardName, me?.data.displayName],
  );

  const preview = useMemo(() => interpolate(body, sampleVars), [body, sampleVars]);

  async function handleSave() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writePrayerEmailTemplate(wardId, { bodyMarkdown: body });
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
      <pre className="rounded-md border border-border bg-parchment-2/60 p-4 font-serif text-[13px] text-walnut-2 leading-relaxed whitespace-pre-wrap wrap-break-word min-h-24">
        {preview}
      </pre>
    </aside>
  );

  return (
    <>
      <MessageTemplateCardDesktop
        sectionId="sec-prayer-email"
        eyebrow="Email"
        title="Prayer invitation email"
        description={DESCRIPTION}
        variables={VARIABLES}
        sampleVars={sampleVars}
        editorLabel="Email body"
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={DEFAULT_PRAYER_EMAIL_BODY}
        onBodyChange={setBody}
        onSave={handleSave}
        onReset={() => setBody(DEFAULT_PRAYER_EMAIL_BODY)}
        className="hidden sm:block"
      />
      <MobileTemplateAccordion
        sectionId="sec-prayer-email-m"
        eyebrow="Email"
        title="Prayer invitation email"
        description={DESCRIPTION}
        preview={previewNode}
        canEdit={canEdit}
        onRequestEdit={openEditor}
        className="sm:hidden"
      />
      <TemplateEditorModal
        open={editorOpen}
        eyebrow="Email"
        title="Prayer invitation email"
        description={DESCRIPTION}
        variables={VARIABLES}
        sampleVars={sampleVars}
        editorLabel="Email body"
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={DEFAULT_PRAYER_EMAIL_BODY}
        dirty={body !== bodyBeforeEdit}
        onChange={setBody}
        onSave={handleSave}
        onCancel={cancelEditor}
        onReset={() => setBody(DEFAULT_PRAYER_EMAIL_BODY)}
      />
    </>
  );
}
