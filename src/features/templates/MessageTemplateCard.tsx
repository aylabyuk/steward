import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import type { MessageTemplateKey } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { interpolate } from "./utils/interpolate";
import { MessageTemplateCardDesktop, PreviewPane } from "./MessageTemplateCardDesktop";
import { MobileTemplateAccordion } from "./MobileTemplateAccordion";
import { TemplateEditorModal } from "./TemplateEditorModal";
import type { TemplateVariableDoc } from "./TemplateVariableList";
import { useMessageTemplate } from "./hooks/useMessageTemplate";
import { writeMessageTemplate } from "./utils/writeMessageTemplate";

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
 *  /settings/templates. Desktop (`≥sm`) renders the editor + preview
 *  side-by-side. Mobile renders a collapsed accordion row and puts the
 *  editor behind a modal so the page stays scannable. */
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

  const previewNode = <PreviewPane preview={preview} kind={kind} />;

  return (
    <>
      <MessageTemplateCardDesktop
        sectionId={sectionId}
        eyebrow={eyebrow}
        title={title}
        description={description}
        variables={variables}
        editorLabel={resolvedEditorLabel}
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={defaultBody}
        previewNode={previewNode}
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
        preview={previewNode}
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
        editorLabel={resolvedEditorLabel}
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={defaultBody}
        onChange={setBody}
        onSave={handleSave}
        onCancel={cancelEditor}
        onReset={() => setBody(defaultBody)}
      />
    </>
  );
}
