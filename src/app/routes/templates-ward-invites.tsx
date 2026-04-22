import Markdown from "react-markdown";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { EditorSection } from "@/features/templates/SpeakerLetterEditor";
import { renderWardInviteMessage } from "@/features/templates/renderWardInviteMessage";
import { useWardInviteTemplate } from "@/features/templates/useWardInviteTemplate";
import { DEFAULT_WARD_INVITE_BODY } from "@/features/templates/wardInviteDefaults";
import { writeWardInviteTemplate } from "@/features/templates/writeWardInviteTemplate";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";

export function WardInviteTemplatePage() {
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
    <main className="pb-16">
      <nav className="mb-4 text-sm text-walnut-2">
        <Link to="/settings" className="hover:text-walnut">
          ← Settings
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="font-display text-[24px] font-semibold text-walnut">
          Ward invitation message
        </h1>
        <p className="font-serif text-[14px] text-walnut-2">
          The greeting shown at the top of the accept-invite page and used as the{" "}
          <code>mailto:</code> body. The sign-in link and "— Sent from Steward" footer are appended
          automatically. Variables: <code>{"{{inviteeName}}"}</code>, <code>{"{{wardName}}"}</code>,{" "}
          <code>{"{{inviterName}}"}</code>, <code>{"{{calling}}"}</code>, <code>{"{{role}}"}</code>.
        </p>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
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
              className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save template"}
            </button>
            <button
              type="button"
              onClick={() => setBody(DEFAULT_WARD_INVITE_BODY)}
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
          <div className="rounded-[14px] border border-border-strong bg-chalk p-6 shadow-elev-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-brass-deep mb-3">
              Ward invitation
            </div>
            <div className="prose prose-sm max-w-none font-serif text-[14px] text-walnut-2 leading-relaxed mb-4">
              <Markdown>{preview}</Markdown>
            </div>
            <div className="rounded-md border border-border bg-parchment-2 p-3 text-center font-sans text-[12.5px] italic text-walnut-3">
              [ Accept invite button appears here ]
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
