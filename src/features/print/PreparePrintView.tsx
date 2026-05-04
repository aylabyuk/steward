import { useState } from "react";
import { Navigate } from "react-router";
import { useAuthStore } from "@/stores/authStore";
import { useFullViewportLayout } from "@/hooks/useFullViewportLayout";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { DesktopOnlyNotice } from "@/features/page-editor/DesktopOnlyNotice";
import type { ProgramTemplateKey } from "@/lib/types";
import { CongregationPrepareTab } from "./CongregationPrepareTab";
import { ConductingPrepareTab } from "./ConductingPrepareTab";
import { PreparePrintHeader } from "./PreparePrintHeader";

interface Props {
  date: string;
}

const TABS: { key: ProgramTemplateKey; label: string; printSegment: string }[] = [
  { key: "conductingProgram", label: "Conducting copy", printSegment: "conducting" },
  { key: "congregationProgram", label: "Congregation copy", printSegment: "congregation" },
];

/** /week/:date/prepare — chrome + tab switcher. Each tab is a self-
 *  contained component: the conducting tab is a Lexical WYSIWYG
 *  editor; the congregation tab is a live cover+program preview with
 *  inline form controls for the editable bits (image URL,
 *  announcements). */
export function PreparePrintView({ date }: Props) {
  useFullViewportLayout();
  const isMobile = useIsMobile();
  const authed = useAuthStore((s) => s.status === "signed_in");
  const [activeKey, setActiveKey] = useState<ProgramTemplateKey>("conductingProgram");
  const [conductingOverride, setConductingOverride] = useState(false);

  if (!authed) return <Navigate to="/login" replace />;
  if (isMobile) return <DesktopOnlyNotice title="Prepare to print" />;

  const activeTab = TABS.find((t) => t.key === activeKey)!;
  // Status pill on conducting reflects the Lexical override state.
  // Congregation tab manages its own preview and doesn't use the pill.
  const usingOverride = activeKey === "conductingProgram" && conductingOverride;

  return (
    <main className="min-h-dvh lg:h-dvh bg-parchment flex flex-col lg:overflow-hidden">
      <PreparePrintHeader
        date={date}
        printSegment={activeTab.printSegment}
        usingOverride={usingOverride}
      />

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
        <ConductingPrepareTab date={date} onUsingOverrideChange={setConductingOverride} />
      ) : (
        <CongregationPrepareTab date={date} />
      )}
    </main>
  );
}
