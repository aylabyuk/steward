import { useEffect, useRef, useState } from "react";
import { $getNodeByKey, type NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLetterVars, useLiveValues } from "@/features/page-editor/letterRenderContext";
import { useVariableMeta, useVariableRegistry } from "@/features/page-editor/variableRegistry";
import { styleStringToReact } from "./chipStyle";
import { VariableChipNode } from "./VariableChipNode";
import { VariableChipPicker } from "./VariableChipPicker";

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKE = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;

interface Props {
  nodeKey: NodeKey;
  token: string;
  format: number;
  style: string;
}

/** React decorator for `VariableChipNode`. Lifted out of the node
 *  module so the node class file stays under the per-file LOC cap;
 *  this component owns the click-to-change picker, the hover
 *  preview tooltip, and the inline-style + format application. */
export function VariableChipView({ nodeKey, token, format, style }: Props) {
  const [editor] = useLexicalComposerContext();
  const meta = useVariableMeta(token);
  const { variables, groupLabels } = useVariableRegistry();
  const liveVars = useLetterVars();
  const isLive = useLiveValues();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const display = liveVars[token] ?? meta?.sample ?? meta?.label ?? token;

  // Click-outside dismiss. Mousedown beats click ordering so a click
  // that lands inside another chip's wrapper closes this one before
  // that one opens — only one picker visible at a time.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function changeTo(nextToken: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof VariableChipNode) node.setToken(nextToken);
    });
    setOpen(false);
  }

  return (
    <span
      ref={wrapRef}
      className="group/chip"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        contentEditable={false}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseDown={(e) => e.preventDefault()}
        style={styleStringToReact(style)}
        className="inline align-baseline px-0 py-0 m-0 bg-transparent border-0 font-serif text-inherit cursor-pointer focus:outline-none rounded-sm hover:bg-brass-soft/25 hover:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--color-brass-soft)_30%,transparent)]"
      >
        {wrapWithFormat(display, format)}
      </button>
      {!open && <ChipTooltip token={token} isLive={isLive} />}
      {open && (
        <VariableChipPicker
          variables={variables}
          groupLabels={groupLabels}
          currentToken={token}
          onPick={changeTo}
        />
      )}
    </span>
  );
}

function ChipTooltip({ token, isLive }: { token: string; isLive: boolean }) {
  return (
    <span
      aria-hidden
      contentEditable={false}
      className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 z-40 whitespace-nowrap rounded-md bg-walnut text-parchment px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] opacity-0 group-hover/chip:opacity-100 transition-opacity duration-100"
    >
      {isLive ? (
        <span className="text-brass-soft">{`{{${token}}}`}</span>
      ) : (
        <>
          Preview · <span className="text-brass-soft">{`{{${token}}}`}</span>
        </>
      )}
    </span>
  );
}

function wrapWithFormat(value: React.ReactNode, format: number): React.ReactNode {
  let el = value;
  if (format & FORMAT_CODE)
    el = <code className="font-mono text-[0.92em] bg-parchment-2 px-1 rounded">{el}</code>;
  if (format & FORMAT_BOLD) el = <strong>{el}</strong>;
  if (format & FORMAT_ITALIC) el = <em>{el}</em>;
  if (format & FORMAT_UNDERLINE) el = <u>{el}</u>;
  if (format & FORMAT_STRIKE) el = <s>{el}</s>;
  return el;
}
