import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import type { MessageTemplateKey } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { interpolate } from "./interpolate";
import { EditorSection } from "./SpeakerLetterEditor";
import { TemplateVariableList, type TemplateVariableDoc } from "./TemplateVariableList";
import { useMessageTemplate } from "./useMessageTemplate";
import { writeMessageTemplate } from "./writeMessageTemplate";

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
 *  /settings/templates. Editor on the left, interpolated preview on
 *  the right; SMS-kind cards add a character + segment counter. Each
 *  card writes its own Firestore doc so there's no page-level savebar
 *  to coordinate. */
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

  useEffect(() => {
    if (loading || seeded) return;
    if (template) setBody(template.bodyMarkdown);
    setSeeded(true);
  }, [loading, seeded, template]);

  const canEdit = Boolean(me?.data.active);
  const preview = useMemo(() => interpolate(body, sampleVars), [body, sampleVars]);

  async function handleSave() {
    if (!wardId) return;
    setSaving(true);
    setError(null);
    try {
      await writeMessageTemplate(wardId, templateKey, { bodyMarkdown: body });
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id={sectionId}
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        {eyebrow}
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">{title}</h2>
      <div className="font-serif italic text-[14px] text-walnut-2 mb-4">{description}</div>

      <TemplateVariableList variables={variables} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] mt-4">
        <div className="flex flex-col gap-3">
          <EditorSection
            label={editorLabel ?? (kind === "sms" ? "Message body" : "Body")}
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
              onClick={() => setBody(defaultBody)}
              disabled={!canEdit || saving}
              className="font-sans text-[13px] font-semibold px-3.5 py-1.5 rounded-md border border-border-strong bg-chalk text-walnut hover:bg-parchment-2 disabled:opacity-60"
            >
              Reset to default
            </button>
          </div>
        </div>
        <PreviewPane preview={preview} kind={kind} />
      </div>
    </section>
  );
}

function PreviewPane({ preview, kind }: { preview: string; kind: "sms" | "email" }) {
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
      <pre className="rounded-md border border-border bg-parchment-2/60 p-4 font-serif text-[13px] text-walnut-2 leading-relaxed whitespace-pre-wrap break-words min-h-24">
        {preview}
      </pre>
    </aside>
  );
}
