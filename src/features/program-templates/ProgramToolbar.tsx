import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $createParagraphNode,
  $getSelection,
  $isRangeSelection,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { $createHeadingNode, $createQuoteNode } from "@lexical/rich-text";
import { INSERT_ORDERED_LIST_COMMAND, INSERT_UNORDERED_LIST_COMMAND } from "@lexical/list";
import { $setBlocksType } from "@lexical/selection";
import { mergeRegister } from "@lexical/utils";
import { InsertVariableMenu } from "./InsertVariableMenu";
import { ProgramToolbarButton, ToolbarSep } from "./ProgramToolbarButton";
import type { ProgramVariable } from "./programVariables";

type BlockKind = "p" | "h1" | "h2" | "h3" | "quote";

interface Props {
  /** Optional Insert-variable surface. Omit both to hide the menu —
   *  consumers without a variable surface (plain message bodies, etc.)
   *  get the same toolbar minus that one slot. */
  variables?: readonly ProgramVariable[];
  groupLabels?: Readonly<Record<string, string>>;
}

export function ProgramToolbar({ variables, groupLabels }: Props) {
  const [editor] = useLexicalComposerContext();
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  useEffect(() => {
    return mergeRegister(
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const s = $getSelection();
          if ($isRangeSelection(s)) {
            setBold(s.hasFormat("bold"));
            setItalic(s.hasFormat("italic"));
            setUnderline(s.hasFormat("underline"));
          }
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (p) => {
          setCanUndo(p);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (p) => {
          setCanRedo(p);
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  function setBlock(kind: BlockKind) {
    editor.update(() => {
      const sel = $getSelection();
      if (!$isRangeSelection(sel)) return;
      $setBlocksType(sel, () => {
        if (kind === "p") return $createParagraphNode();
        if (kind === "quote") return $createQuoteNode();
        return $createHeadingNode(kind);
      });
    });
  }

  const fmt = (mode: "bold" | "italic" | "underline") =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, mode);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border flex-wrap">
      <ProgramToolbarButton
        ariaLabel="Undo"
        label="↶"
        disabled={!canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      />
      <ProgramToolbarButton
        ariaLabel="Redo"
        label="↷"
        disabled={!canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      />
      <ToolbarSep />
      <ProgramToolbarButton ariaLabel="Paragraph" label="¶" onClick={() => setBlock("p")} />
      <ProgramToolbarButton ariaLabel="Heading 1" label="H1" onClick={() => setBlock("h1")} />
      <ProgramToolbarButton ariaLabel="Heading 2" label="H2" onClick={() => setBlock("h2")} />
      <ProgramToolbarButton ariaLabel="Heading 3" label="H3" onClick={() => setBlock("h3")} />
      <ProgramToolbarButton ariaLabel="Quote" label="“ ”" onClick={() => setBlock("quote")} />
      <ToolbarSep />
      <ProgramToolbarButton
        ariaLabel="Bulleted list"
        label="• List"
        onClick={() => editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)}
      />
      <ProgramToolbarButton
        ariaLabel="Numbered list"
        label="1. List"
        onClick={() => editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined)}
      />
      <ToolbarSep />
      <ProgramToolbarButton
        ariaLabel="Bold"
        ariaPressed={bold}
        active={bold}
        bold
        label="B"
        onClick={() => fmt("bold")}
      />
      <ProgramToolbarButton
        ariaLabel="Italic"
        ariaPressed={italic}
        active={italic}
        italic
        label="I"
        onClick={() => fmt("italic")}
      />
      <ProgramToolbarButton
        ariaLabel="Underline"
        ariaPressed={underline}
        active={underline}
        underline
        label="U"
        onClick={() => fmt("underline")}
      />
      {variables && groupLabels && (
        <>
          <ToolbarSep />
          <InsertVariableMenu variables={variables} groupLabels={groupLabels} />
        </>
      )}
    </div>
  );
}
