import { useState } from "react";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  type LexicalEditor,
} from "lexical";
import { $createHeadingNode, $createQuoteNode, type HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import { ToolbarButton } from "./ToolbarButton";
import type { BlockType } from "./useToolbarState";

interface Props {
  editor: LexicalEditor;
  current: BlockType;
}

const OPTIONS: { value: BlockType; label: string; icon: string }[] = [
  { value: "paragraph", label: "Paragraph", icon: "¶" },
  { value: "h1", label: "Heading 1", icon: "H1" },
  { value: "h2", label: "Heading 2", icon: "H2" },
  { value: "h3", label: "Heading 3", icon: "H3" },
  { value: "quote", label: "Quote", icon: "❝" },
  { value: "bullet", label: "Bullet list", icon: "•" },
  { value: "number", label: "Numbered list", icon: "1." },
];

const LABEL_BY_VALUE = Object.fromEntries(OPTIONS.map((o) => [o.value, o.label])) as Record<
  BlockType,
  string
>;

/** Block-type selector — paragraph / H1-3 / quote / bullet / numbered.
 *  Click commits via Lexical's heading / quote factories or the list
 *  insertion commands. The popover picks up + paints the current block
 *  type, so the bishop sees what they're working in. */
export function BlockTypeDropdown({ editor, current }: Props) {
  const [open, setOpen] = useState(false);

  function applyBlock(value: BlockType) {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      if (current === "bullet" || current === "number") {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
      switch (value) {
        case "paragraph":
          $setBlocksType(sel, () => $createParagraphNode());
          break;
        case "quote":
          $setBlocksType(sel, () => $createQuoteNode());
          break;
        case "h1":
        case "h2":
        case "h3":
          $setBlocksType(sel, () => $createHeadingNode(value as HeadingTagType));
          break;
        case "bullet":
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          break;
        case "number":
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          break;
      }
    });
    setOpen(false);
  }

  return (
    <span className="relative inline-flex">
      <ToolbarButton
        label={LABEL_BY_VALUE[current]}
        onClick={() => setOpen((o) => !o)}
        className="px-2 min-w-[8rem] justify-between gap-2"
      >
        <span className="truncate text-left flex-1">{LABEL_BY_VALUE[current]}</span>
        <span aria-hidden className="text-walnut-3">
          ▾
        </span>
      </ToolbarButton>
      {open && (
        <div
          role="menu"
          className="absolute top-[calc(100%+4px)] left-0 z-30 w-44 rounded-md border border-border-strong bg-chalk shadow-elev-3 py-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => applyBlock(opt.value)}
              className={`w-full px-3 py-1.5 flex items-center gap-2 text-left text-[13px] hover:bg-parchment-2 ${current === opt.value ? "bg-parchment-2/60" : ""}`}
            >
              <span className="font-mono text-walnut-3 w-6 text-center">{opt.icon}</span>
              <span className="text-walnut">{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
