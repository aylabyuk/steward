import { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import { renderWardInviteMessage } from "./renderWardInviteMessage";
import { EditorSection } from "./SpeakerLetterEditor";
import { useWardInviteTemplate } from "./useWardInviteTemplate";
import { DEFAULT_WARD_INVITE_BODY } from "./wardInviteDefaults";
import { writeWardInviteTemplate } from "./writeWardInviteTemplate";

/** Templates → Ward invitation message section. Greeting shown at
 *  the top of the accept-invite page and used as the mailto body. */
export function WardInviteSection(): React.ReactElement {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const { data: template, loading } = useWardInviteTemplate();

  const [body, setBody] = useState(DEFAULT_WARD_INVITE_BODY);
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
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      id="sec-ward-invite"
      className="bg-chalk border border-border rounded-lg p-6 mb-4 scroll-mt-24"
    >
      <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium mb-1">
        Template
      </div>
      <h2 className="font-display text-[22px] font-semibold text-walnut mb-1">
        Ward invitation message
      </h2>
      <p className="font-serif italic text-[14px] text-walnut-2 mb-5">
        The greeting shown at the top of the accept-invite page and used as the <code>mailto:</code>{" "}
        body when you invite a new bishopric or clerk member. The sign-in link and footer are
        appended automatically. Variables: <code>{"{{inviteeName}}"}</code>,{" "}
        <code>{"{{wardName}}"}</code>, <code>{"{{inviterName}}"}</code>,{" "}
        <code>{"{{calling}}"}</code>, <code>{"{{role}}"}</code>.
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          <EditorSection
            label="Invitation greeting"
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
              onClick={() => setBody(DEFAULT_WARD_INVITE_BODY)}
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
          <div className="rounded-md border border-border bg-parchment-2/60 p-4">
            <div className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-brass-deep mb-2">
              Ward invitation
            </div>
            <div className="prose prose-sm max-w-none font-serif text-[13.5px] text-walnut-2 leading-relaxed mb-3">
              <Markdown>{preview}</Markdown>
            </div>
            <div className="rounded-md border border-border bg-chalk p-2.5 text-center font-sans text-[12px] italic text-walnut-3">
              [ Accept invite button appears here ]
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
