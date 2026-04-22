import { useMemo } from "react";
import { EditorSection } from "./SpeakerLetterEditor";
import { renderSpeakerEmailBody } from "./renderSpeakerEmailBody";
import type { EmailVars } from "./prepareInvitationVars";

interface Props {
  body: string;
  setBody: (v: string) => void;
  hasOverride: boolean;
  disabled: boolean;
  vars: EmailVars;
  onRevertToDefault: () => void;
  onClearOverride: () => void;
}

/** Email tab inside PrepareInvitationDialog — editor on the left,
 *  plain-text preview on the right (matches what will land in the
 *  recipient's inbox once mailto opens). */
export function PrepareInvitationEmailTab({
  body,
  setBody,
  hasOverride,
  disabled,
  vars,
  onRevertToDefault,
  onClearOverride,
}: Props) {
  const rendered = useMemo(
    () => renderSpeakerEmailBody(vars, { override: body, template: null }),
    [body, vars],
  );

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
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
        <EditorSection label="Email body" initialMarkdown={body} onChange={setBody} />
        <p className="font-serif italic text-[12px] text-walnut-3">
          The sign-in link shown in the preview is a placeholder — the real invitation URL is
          generated when you click "Send email".
        </p>
      </div>
      <aside className="flex flex-col gap-2">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
          Preview — plain-text email
        </div>
        <pre className="rounded-[14px] border border-border-strong bg-chalk p-5 shadow-elev-1 font-serif text-[13.5px] text-walnut-2 leading-relaxed whitespace-pre-wrap break-words">
          {rendered}
        </pre>
      </aside>
    </div>
  );
}
