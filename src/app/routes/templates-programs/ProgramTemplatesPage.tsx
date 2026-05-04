import { useState } from "react";
import { Link } from "react-router";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { ProgramTemplateKey } from "@/lib/types";
import { CongregationTemplateTab } from "@/features/print/CongregationTemplateTab";
import { ConductingTemplateTab } from "@/features/program-templates/ConductingTemplateTab";
import { DesktopOnlyNotice } from "@/features/page-editor/DesktopOnlyNotice";

const TABS: { key: ProgramTemplateKey; label: string }[] = [
  { key: "conductingProgram", label: "Conducting copy" },
  { key: "congregationProgram", label: "Congregation copy" },
];

/** /settings/templates/programs — chrome + tab switcher. The
 *  conducting tab hosts a Lexical WYSIWYG editor (variable chips +
 *  free-form layout); the congregation tab hosts a form-and-preview
 *  editor for the bulletin's editable bits (cover image URL +
 *  program footer note). Each tab manages its own dirty/save state
 *  and SaveBar. */
export function ProgramTemplatesPage(): React.ReactElement {
  useFullViewportLayout();
  const isMobile = useIsMobile();
  const [activeKey, setActiveKey] = useState<ProgramTemplateKey>("conductingProgram");
  const [conductingUsingDefault, setConductingUsingDefault] = useState(false);

  if (isMobile) return <DesktopOnlyNotice title="Program templates" />;

  const showSystemDefaultPill = activeKey === "conductingProgram" && conductingUsingDefault;

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <header className="shrink-0 border-b border-border bg-chalk px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div className="flex flex-col gap-1 min-w-0">
          <Link
            to="/settings/templates"
            className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep hover:text-walnut"
          >
            ← Templates
          </Link>
          <h1 className="font-display text-[22px] sm:text-[26px] font-semibold text-walnut leading-tight">
            Program templates
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {showSystemDefaultPill && (
            <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-brass-soft bg-brass-soft/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
              <span aria-hidden>★</span>
              System default — save to lock in
            </span>
          )}
        </div>
      </header>

      <nav className="shrink-0 flex gap-1 border-b border-border bg-parchment-2/30 px-5 sm:px-8 pt-3">
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

      {activeKey === "conductingProgram" ? (
        <ConductingTemplateTab onUsingDefaultChange={setConductingUsingDefault} />
      ) : (
        <CongregationTemplateTab />
      )}
    </main>
  );
}
