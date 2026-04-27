import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextNode,
  type LexicalEditor,
} from "lexical";
import { Icon } from "./Icon";
import { usePopover } from "./hooks/usePopover";

interface Props {
  editor: LexicalEditor;
}

function applyTransform(editor: LexicalEditor, fn: (s: string) => string) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    const text = sel.getTextContent();
    if (!text) return;
    sel.insertText(fn(text));
  });
}

function titleCase(s: string): string {
  return s.replace(/\w\S*/g, (t) => t[0]!.toUpperCase() + t.slice(1).toLowerCase());
}

function clearFormat(editor: LexicalEditor) {
  editor.update(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel)) return;
    sel.getNodes().forEach((n) => {
      if (n instanceof TextNode) {
        n.setFormat(0);
        n.setStyle("");
      }
    });
  });
}

/** Case + format menu — lower/UPPER/Title case, sub/sup, clear
 *  formatting. Lifted from the design kit's case popover so the
 *  toolbar exposes every tool the playground does. */
export function CaseFormatMenu({ editor }: Props) {
  const pop = usePopover();
  return (
    <div ref={pop.ref} style={{ position: "relative" }}>
      <button
        type="button"
        title="Formatting"
        className="tb-select"
        onClick={() => pop.setOpen((o) => !o)}
        onMouseDown={(e) => e.preventDefault()}
      >
        <span className="tb-select__icon">
          <Icon name="caseSensitive" size={16} sw={2} />
        </span>
        <Icon name="chevronDown" size={11} sw={2} className="tb-select__caret lucide" />
      </button>
      {pop.open && (
        <div className="tb-popover" style={{ position: "absolute", top: 38, left: 0 }}>
          <div className="tb-popover__label">Case</div>
          <button
            type="button"
            className="tb-popover__item"
            onClick={() => {
              applyTransform(editor, (s) => s.toLowerCase());
              pop.setOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            lowercase
          </button>
          <button
            type="button"
            className="tb-popover__item"
            onClick={() => {
              applyTransform(editor, (s) => s.toUpperCase());
              pop.setOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            UPPERCASE
          </button>
          <button
            type="button"
            className="tb-popover__item"
            onClick={() => {
              applyTransform(editor, titleCase);
              pop.setOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            Title Case
          </button>
          <div className="tb-popover__divider" />
          <div className="tb-popover__label">Format</div>
          <button
            type="button"
            className="tb-popover__item"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "subscript");
              pop.setOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            Subscript
            <span className="kbd">x₂</span>
          </button>
          <button
            type="button"
            className="tb-popover__item"
            onClick={() => {
              editor.dispatchCommand(FORMAT_TEXT_COMMAND, "superscript");
              pop.setOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            Superscript
            <span className="kbd">x²</span>
          </button>
          <div className="tb-popover__divider" />
          <button
            type="button"
            className="tb-popover__item"
            onClick={() => {
              clearFormat(editor);
              pop.setOpen(false);
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <Icon name="trash" size={16} />
            Clear formatting
          </button>
        </div>
      )}
    </div>
  );
}
