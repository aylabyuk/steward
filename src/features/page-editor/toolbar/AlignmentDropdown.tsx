import { useState } from "react";
import {
  FORMAT_ELEMENT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  type ElementFormatType,
  type LexicalEditor,
} from "lexical";
import { ToolbarButton } from "./ToolbarButton";

interface Props {
  editor: LexicalEditor;
  current: ElementFormatType;
}

const ALIGN_OPTIONS: { value: ElementFormatType; label: string; icon: string; shortcut: string }[] =
  [
    { value: "left", label: "Left align", icon: "⇤", shortcut: "⌘⇧L" },
    { value: "center", label: "Center align", icon: "≡", shortcut: "⌘⇧E" },
    { value: "right", label: "Right align", icon: "⇥", shortcut: "⌘⇧R" },
    { value: "justify", label: "Justify", icon: "☰", shortcut: "⌘⇧J" },
  ];

const ICON_BY_VALUE = Object.fromEntries(ALIGN_OPTIONS.map((o) => [o.value, o.icon])) as Record<
  string,
  string
>;

/** Alignment + indent dropdown — covers FORMAT_ELEMENT_COMMAND for
 *  left / center / right / justify and INDENT/OUTDENT_CONTENT_COMMAND
 *  for nested content. The trigger button reflects the active
 *  alignment so the bishop can see what they're set to. */
export function AlignmentDropdown({ editor, current }: Props) {
  const [open, setOpen] = useState(false);

  function applyAlign(value: ElementFormatType) {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, value);
    setOpen(false);
  }

  return (
    <span className="relative inline-flex">
      <ToolbarButton label="Alignment" onClick={() => setOpen((o) => !o)} className="gap-1.5">
        <span aria-hidden>{ICON_BY_VALUE[current || "left"] ?? "⇤"}</span>
        <span aria-hidden className="text-walnut-3 text-[10px]">
          ▾
        </span>
      </ToolbarButton>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+4px)] right-0 z-30 w-52 rounded-md border border-border-strong bg-chalk shadow-elev-3 py-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          {ALIGN_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applyAlign(opt.value)}
              className={`w-full px-3 py-1.5 flex items-center gap-3 text-left text-[13px] hover:bg-parchment-2 ${current === opt.value ? "bg-parchment-2/60" : ""}`}
            >
              <span className="font-mono text-walnut-3 w-5 text-center">{opt.icon}</span>
              <span className="flex-1 text-walnut">{opt.label}</span>
              <span className="font-mono text-[10px] text-walnut-3">{opt.shortcut}</span>
            </button>
          ))}
          <div className="my-1 border-t border-border" />
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(OUTDENT_CONTENT_COMMAND, undefined);
              setOpen(false);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-3 text-left text-[13px] hover:bg-parchment-2"
          >
            <span className="font-mono text-walnut-3 w-5 text-center">⇤</span>
            <span className="flex-1 text-walnut">Outdent</span>
            <span className="font-mono text-[10px] text-walnut-3">⌘[</span>
          </button>
          <button
            type="button"
            onClick={() => {
              editor.dispatchCommand(INDENT_CONTENT_COMMAND, undefined);
              setOpen(false);
            }}
            className="w-full px-3 py-1.5 flex items-center gap-3 text-left text-[13px] hover:bg-parchment-2"
          >
            <span className="font-mono text-walnut-3 w-5 text-center">⇥</span>
            <span className="flex-1 text-walnut">Indent</span>
            <span className="font-mono text-[10px] text-walnut-3">⌘]</span>
          </button>
        </div>
      )}
    </span>
  );
}
