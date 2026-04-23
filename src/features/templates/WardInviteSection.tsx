import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { MessageTemplateCardDesktop } from "./MessageTemplateCardDesktop";
import { MobileTemplateAccordion } from "./MobileTemplateAccordion";
import { renderWardInviteMessage } from "./renderWardInviteMessage";
import { TemplateEditorModal } from "./TemplateEditorModal";
import { useWardInviteTemplate } from "./useWardInviteTemplate";
import { DEFAULT_WARD_INVITE_BODY } from "./wardInviteDefaults";
import { writeWardInviteTemplate } from "./writeWardInviteTemplate";

const VARIABLES = [
  { name: "inviteeName", hint: "Member being invited" },
  { name: "wardName", hint: "Your ward name" },
  { name: "inviterName", hint: "Bishop or counselor sending the invite" },
  { name: "calling", hint: "Their calling (e.g. 'executive secretary')" },
  { name: "role", hint: "App role — 'bishopric' or 'clerk'" },
] as const;

const DESCRIPTION =
  "The greeting shown at the top of the accept-invite page and used as the mailto body when you invite a new bishopric or clerk member. The sign-in link and footer are appended automatically below.";

export function WardInviteSection(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useWardInviteTemplate();

  const [body, setBody] = useState(DEFAULT_WARD_INVITE_BODY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [bodyBeforeEdit, setBodyBeforeEdit] = useState(DEFAULT_WARD_INVITE_BODY);

  useEffect(() => {
    if (loading || seeded) return;
    if (template) setBody(template.bodyMarkdown);
    setSeeded(true);
  }, [loading, seeded, template]);

  const canEdit = Boolean(me?.data.active);
  const wardName = ward.data?.name ?? "";

  const preview = useMemo(
    () =>
      renderWardInviteMessage(
        {
          inviteeName: "Brother Lloyd Flores",
          wardName: wardName || "Your Ward",
          inviterName: me?.data.displayName ?? "Bishop",
          calling: "executive_secretary",
          role: "clerk",
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
      await writeWardInviteTemplate(wardId, { bodyMarkdown: body });
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
        sectionId="sec-ward-invite"
        eyebrow="Ward"
        title="Ward invitation message"
        description={DESCRIPTION}
        variables={VARIABLES}
        editorLabel="Invitation greeting"
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={DEFAULT_WARD_INVITE_BODY}
        previewNode={previewNode}
        onBodyChange={setBody}
        onSave={handleSave}
        onReset={() => setBody(DEFAULT_WARD_INVITE_BODY)}
        className="hidden sm:block"
      />
      <MobileTemplateAccordion
        sectionId="sec-ward-invite-m"
        eyebrow="Ward"
        title="Ward invitation message"
        description={DESCRIPTION}
        variables={VARIABLES}
        preview={previewNode}
        canEdit={canEdit}
        onRequestEdit={openEditor}
        className="sm:hidden"
      />
      <TemplateEditorModal
        open={editorOpen}
        eyebrow="Ward"
        title="Ward invitation message"
        editorLabel="Invitation greeting"
        canEdit={canEdit}
        saving={saving}
        error={error}
        body={body}
        defaultBody={DEFAULT_WARD_INVITE_BODY}
        onChange={setBody}
        onSave={handleSave}
        onCancel={cancelEditor}
        onReset={() => setBody(DEFAULT_WARD_INVITE_BODY)}
      />
    </>
  );
}
