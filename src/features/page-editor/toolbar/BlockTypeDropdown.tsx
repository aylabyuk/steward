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
import { Icon, type IconName } from "./Icon";
import { usePopover } from "./hooks/usePopover";
import type { BlockType } from "./hooks/useToolbarState";

interface Props {
  editor: LexicalEditor;
  current: BlockType;
}

interface Option {
  key: BlockType;
  label: string;
  icon: IconName;
}

const OPTIONS: Option[] = [
  { key: "paragraph", label: "Normal", icon: "text" },
  { key: "h1", label: "Heading 1", icon: "heading1" },
  { key: "h2", label: "Heading 2", icon: "heading2" },
  { key: "h3", label: "Heading 3", icon: "heading3" },
  { key: "bullet", label: "Bullet list", icon: "list" },
  { key: "number", label: "Numbered list", icon: "listOrdered" },
  { key: "quote", label: "Quote", icon: "quote" },
];

export function BlockTypeDropdown({ editor, current }: Props) {
  const pop = usePopover();
  const active = OPTIONS.find((o) => o.key === current) ?? OPTIONS[0]!;

  function apply(value: BlockType) {
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
    pop.setOpen(false);
  }

  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        className="tb-select tb-block-select"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="tb-select__icon">
          <Icon name={active.icon} size={14} />
        </span>
        <span className="tb-select__label">{active.label}</span>
        <Icon name="chevronDown" size={11} sw={2} className="tb-select__caret lucide" />
      </button>
      {pop.open && (
        <div className="tb-popover" style={{ position: "absolute", top: 38, left: 0 }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              className="tb-popover__item"
              onClick={() => apply(opt.key)}
              onMouseDown={(e) => e.preventDefault()}
            >
              <Icon name={opt.icon} size={16} />
              {opt.label}
              {current === opt.key && (
                <span className="kbd">
                  <Icon name="check" size={14} />
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
