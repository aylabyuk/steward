import { useMemo } from "react";
import { ScaledLetterPreview } from "./ScaledLetterPreview";
import { SpeakerLetterGuide } from "./SpeakerLetterGuide";
import { EditorSection } from "./SpeakerLetterEditor";
import { interpolate } from "./interpolate";
import type { LetterVars } from "./prepareInvitationVars";

interface Props {
  body: string;
  footer: string;
  setBody: (v: string) => void;
  setFooter: (v: string) => void;
  hasOverride: boolean;
  disabled: boolean;
  vars: LetterVars;
  onRevertToDefault: () => void;
  onClearOverride: () => void;
}

/** Letter-editor column on the left, paper-sized preview on the right.
 *  The preview mimics a real 8.5×11 sheet so the bishop sees the
 *  letter at its true proportions before printing or sending. */
export function PrepareInvitationLetterTab({
  body,
  footer,
  setBody,
  setFooter,
  hasOverride,
  disabled,
  vars,
  onRevertToDefault,
  onClearOverride,
}: Props) {
  const renderedBody = useMemo(() => interpolate(body, vars), [body, vars]);
  const renderedFooter = useMemo(() => interpolate(footer, vars), [footer, vars]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] items-start">
      <div className="flex flex-col gap-4 min-w-0 lg:h-[calc(100dvh-11rem)] lg:overflow-y-auto lg:pr-2">
        <TabActionRow
          hasOverride={hasOverride}
          disabled={disabled}
          onRevertToDefault={onRevertToDefault}
          onClearOverride={onClearOverride}
        />
        <SpeakerLetterGuide />
        <EditorSection label="Letter body" initialMarkdown={body} onChange={setBody} />
        <EditorSection label="Footer (scripture)" initialMarkdown={footer} onChange={setFooter} />
      </div>
      <aside className="flex flex-col gap-2 min-w-0">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
          Preview — 8.5 × 11 in
        </div>
        <ScaledLetterPreview
          wardName={vars.wardName}
          assignedDate={vars.date}
          today={vars.today}
          bodyMarkdown={renderedBody}
          footerMarkdown={renderedFooter}
          height="calc(100dvh - 11rem)"
        />
      </aside>
    </div>
  );
}

function TabActionRow({
  hasOverride,
  disabled,
  onRevertToDefault,
  onClearOverride,
}: {
  hasOverride: boolean;
  disabled: boolean;
  onRevertToDefault: () => void;
  onClearOverride: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      {hasOverride ? (
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep">
          Using per-speaker override
        </span>
      ) : (
        <span />
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onRevertToDefault}
          disabled={disabled}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-bordeaux disabled:opacity-60"
        >
          Revert to ward default
        </button>
        {hasOverride && (
          <button
            type="button"
            onClick={onClearOverride}
            disabled={disabled}
            className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:text-bordeaux disabled:opacity-60"
          >
            Clear override
          </button>
        )}
      </div>
    </div>
  );
}
