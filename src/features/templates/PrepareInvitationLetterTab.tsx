import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { EditPreviewToggle, type LetterViewMode } from "./EditPreviewToggle";
import { PrintOnlyLetter } from "./PrintOnlyLetter";
import { ScaledLetterPreview } from "./ScaledLetterPreview";
import { SpeakerLetterGuide } from "./SpeakerLetterGuide";
import { EditorSection } from "./MarkdownEditor";
import { interpolate } from "./interpolate";
import type { LetterVars } from "./prepareInvitationVars";

interface Props {
  body: string;
  footer: string;
  setBody: (v: string) => void;
  setFooter: (v: string) => void;
  vars: LetterVars;
  /** Desktop-only toolbar rendered absolute-top-right inside the
   *  preview container. Mobile uses the page-header toolbar instead. */
  previewToolbar?: React.ReactNode;
}

/** Letter-editor column on the left, paper-sized preview on the right.
 *  The preview mimics a real 8.5×11 sheet so the bishop sees the
 *  letter at its true proportions before printing or sending. On
 *  mobile the right column is hidden and a tab toggle lets the bishop
 *  flip between Edit and Preview in the same column — keeping the
 *  page's primary CTA the only red button on screen. */
export function PrepareInvitationLetterTab({
  body,
  footer,
  setBody,
  setFooter,
  vars,
  previewToolbar,
}: Props) {
  const renderedBody = useMemo(() => interpolate(body, vars), [body, vars]);
  const renderedFooter = useMemo(() => interpolate(footer, vars), [footer, vars]);
  const [viewMode, setViewMode] = useState<LetterViewMode>("edit");
  const showPreviewOnMobile = viewMode === "preview";

  return (
    <>
      <PrintOnlyLetter
        wardName={vars.wardName}
        assignedDate={vars.date}
        today={vars.today}
        bodyMarkdown={renderedBody}
        footerMarkdown={renderedFooter}
      />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start lg:h-full lg:min-h-0">
        <div className="flex flex-col gap-4 min-w-0 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          <EditPreviewToggle className="lg:hidden" value={viewMode} onChange={setViewMode} />
          {showPreviewOnMobile && (
            <div className="lg:hidden h-[70dvh] min-h-105">
              <ScaledLetterPreview
                wardName={vars.wardName}
                assignedDate={vars.date}
                today={vars.today}
                bodyMarkdown={renderedBody}
                footerMarkdown={renderedFooter}
                height="100%"
              />
            </div>
          )}
          <div className={cn("flex flex-col gap-4", showPreviewOnMobile && "hidden lg:flex")}>
            <SpeakerLetterGuide />
            <EditorSection label="Letter body" initialMarkdown={body} onChange={setBody} />
            <EditorSection
              label="Footer (scripture)"
              initialMarkdown={footer}
              onChange={setFooter}
            />
          </div>
        </div>
        <aside className="hidden lg:flex flex-col gap-2 min-w-0 lg:h-full lg:min-h-0">
          <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            Preview — 8.5 × 11 in
          </div>
          <div className="relative flex-1 min-h-0">
            <ScaledLetterPreview
              wardName={vars.wardName}
              assignedDate={vars.date}
              today={vars.today}
              bodyMarkdown={renderedBody}
              footerMarkdown={renderedFooter}
              height="100%"
            />
            {previewToolbar && <div className="absolute top-3 right-3 z-10">{previewToolbar}</div>}
          </div>
        </aside>
      </div>
    </>
  );
}
