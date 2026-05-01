import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import type { MessageTemplateKey } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { interpolate } from "./utils/interpolate";
import { MessageTemplateCardDesktop } from "./MessageTemplateCardDesktop";
import { MobileTemplateAccordion } from "./MobileTemplateAccordion";
import { TemplateEditorModal } from "./TemplateEditorModal";
import type { TemplateVariableDoc } from "./TemplateVariableList";
import { useMessageTemplate } from "./hooks/useMessageTemplate";
import { writeMessageTemplate } from "./utils/writeMessageTemplate";

const SMS_SEGMENT = 160;

interface Props {
  sectionId: string;
  eyebrow: string;
  title: string;
  description: React.ReactNode;
  templateKey: MessageTemplateKey;
  defaultBody: string;
  kind: "sms" | "email";
  variables: readonly TemplateVariableDoc[];
  sampleVars: Readonly<Record<string, string>>;
  editorLabel?: string;
}

/** Shared card for every server-side messaging template section on
 *  /settings/templates. Desktop (`≥sm`) renders a single column where
 *  the editor itself doubles as the preview (variable chips render
 *  their sample values inline). Mobile renders a collapsed accordion
 *  showing the interpolated preview text and puts the editor behind a
 *  fullscreen modal. */
export function MessageTemplateCard({
  sectionId,
  eyebrow,
  title,
  description,
  templateKey,
  defaultBody,
  kind,
  variables,
  sampleVars,
  editorLabel,
}: Props): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const { data: template, loading } = useMessageTemplate(templateKey);

  const [body, setBody] = useState(defaultBody);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [bodyBeforeEdit, setBodyBeforeEdit] = useState(defaultBody);

  useEffect(() => {
    if (loading || seeded) return;
    if (template) setBody(template.bodyMarkdown);
    setSeeded(true);
  }, [loading, seeded, template]);

  const canEdit = Boolean(me?.data.active);
  const preview = useMemo(() => interpolate(body, sampleVars), [body, sampleVars]);
  const resolvedEditorLabel = editorLabel ?? (kind === "sms" ? "Message body" : "Body");

  async function handleSave() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeMessageTemplate(wardId, templateKey, { bodyMarkdown: body });
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

  return (
    <>
      <MessageTemplateCardDesktop
        sectionId={sectionId}
        eyebrow={eyebrow}
        title={title}
        description={description}
        variables={variables}
        sampleVars={sampleVars}
        editorLabel={resolvedEditorLabel}
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={defaultBody}
        onBodyChange={setBody}
        onSave={handleSave}
        onReset={() => setBody(defaultBody)}
        className="hidden sm:block"
      />
      <MobileTemplateAccordion
        sectionId={`${sectionId}-m`}
        eyebrow={eyebrow}
        title={title}
        description={description}
        preview={<MobilePreview preview={preview} kind={kind} />}
        canEdit={canEdit}
        onRequestEdit={openEditor}
        className="sm:hidden"
      />
      <TemplateEditorModal
        open={editorOpen}
        eyebrow={eyebrow}
        title={title}
        description={description}
        variables={variables}
        sampleVars={sampleVars}
        editorLabel={resolvedEditorLabel}
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={defaultBody}
        dirty={body !== bodyBeforeEdit}
        onChange={setBody}
        onSave={handleSave}
        onCancel={cancelEditor}
        onReset={() => setBody(defaultBody)}
      />
    </>
  );
}

function MobilePreview({ preview, kind }: { preview: string; kind: "sms" | "email" }) {
  const segments = kind === "sms" ? Math.max(1, Math.ceil(preview.length / SMS_SEGMENT)) : null;
  return (
    <aside className="flex flex-col gap-2 min-w-0">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
        <span>Preview — sample data</span>
        {kind === "sms" && (
          <span>
            {preview.length} chars · {segments === 1 ? "1 segment" : `${segments} segments`}
          </span>
        )}
      </div>
      <pre className="rounded-md border border-border bg-parchment-2/60 p-4 font-serif text-[13px] text-walnut-2 leading-relaxed whitespace-pre-wrap wrap-break-word min-h-24">
        {preview}
      </pre>
    </aside>
  );
}
