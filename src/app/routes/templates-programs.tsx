import { useState } from "react";
import { Link } from "react-router";
import { SaveBar } from "@/components/ui/SaveBar";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { friendlyWriteError } from "@/stores/saveStatusStore";
import type { ProgramTemplateKey } from "@/lib/types";
import { ProgramTemplatesPanel } from "@/features/program-templates/ProgramTemplatesPanel";
import { useProgramTemplate } from "@/features/program-templates/useProgramTemplate";
import { writeProgramTemplate } from "@/features/program-templates/writeProgramTemplate";

const TABS: { key: ProgramTemplateKey; label: string; description: string }[] = [
  {
    key: "conductingProgram",
    label: "Conducting copy",
    description:
      "Bishop's script-cue edition. Variables can stand in for speakers, hymns, leadership and announcements.",
  },
  {
    key: "congregationProgram",
    label: "Congregation copy",
    description:
      "Two-column printable program seen by the ward. Same variable surface; different layout at print time.",
  },
];

function nowLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

/** /settings/templates/programs — conducting + congregation editors
 *  (Lexical, JSON-state storage). State is the source of truth; the
 *  preview pane resolves variable chips against sample data so the
 *  bishop sees the printed output as they author. */
export function ProgramTemplatesPage(): React.ReactElement {
  useFullViewportLayout();
  const wardId = useCurrentWardStore((s) => s.wardId);
  const me = useCurrentMember();
  const canEdit = Boolean(me?.data.active);

  const [activeKey, setActiveKey] = useState<ProgramTemplateKey>("conductingProgram");
  const conducting = useProgramTemplate("conductingProgram");
  const congregation = useProgramTemplate("congregationProgram");
  const initialJson =
    activeKey === "conductingProgram"
      ? (conducting.data?.editorStateJson ?? null)
      : (congregation.data?.editorStateJson ?? null);

  const [draft, setDraft] = useState<Record<ProgramTemplateKey, string | null>>({
    conductingProgram: null,
    congregationProgram: null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const editorJson = draft[activeKey] ?? initialJson;
  const dirty = draft[activeKey] !== null && draft[activeKey] !== (initialJson ?? "");

  async function save() {
    if (!wardId) return;
    const json = draft[activeKey];
    if (json === null) return;
    setSaving(true);
    setError(null);
    try {
      await writeProgramTemplate(wardId, activeKey, json);
      setSavedAt(nowLabel());
    } catch (e) {
      setError(friendlyWriteError(e));
    } finally {
      setSaving(false);
    }
  }

  const activeTab = TABS.find((t) => t.key === activeKey)!;

  return (
    <main className="min-h-dvh bg-parchment flex flex-col">
      <header className="border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to="/schedule"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
          >
            ← Schedule
          </Link>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
            Program templates
          </h1>
        </div>
        <button
          type="button"
          onClick={() => window.close()}
          className="shrink-0 rounded-md border border-border-strong bg-chalk px-3 py-1.5 font-sans text-[12.5px] font-semibold text-walnut-2 hover:bg-parchment-2"
        >
          Close
        </button>
      </header>

      <nav className="flex gap-1 border-b border-border bg-parchment-2/30 px-5 sm:px-8 pt-3">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setActiveKey(t.key)}
            className={
              activeKey === t.key
                ? "px-3 py-2 -mb-px border-b-2 border-bordeaux font-sans text-[13.5px] font-semibold text-walnut"
                : "px-3 py-2 -mb-px border-b-2 border-transparent font-sans text-[13.5px] text-walnut-2 hover:text-walnut"
            }
          >
            {t.label}
          </button>
        ))}
      </nav>

      <ProgramTemplatesPanel
        activeKey={activeKey}
        description={activeTab.description}
        ariaLabel={activeTab.label}
        editorJson={editorJson}
        canEdit={canEdit}
        onChange={(json) => setDraft((d) => ({ ...d, [activeKey]: json }))}
      />

      <SaveBar
        dirty={dirty && canEdit}
        saving={saving}
        savedAt={savedAt}
        error={error}
        onDiscard={() => {
          setDraft((d) => ({ ...d, [activeKey]: null }));
          setError(null);
        }}
        onSave={() => void save()}
      />
    </main>
  );
}
