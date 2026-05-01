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
import { ProgramToolbarRows } from "./ProgramToolbarRows";
import type { ProgramVariable } from "./utils/programVariables";

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
      editor.registerCommand(CAN_UNDO_COMMAND, (p) => (setCanUndo(p), false), COMMAND_PRIORITY_LOW),
      editor.registerCommand(CAN_REDO_COMMAND, (p) => (setCanRedo(p), false), COMMAND_PRIORITY_LOW),
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

  const fmt = (m: "bold" | "italic" | "underline") =>
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, m);
  const cmd = (c: typeof UNDO_COMMAND) => editor.dispatchCommand(c, undefined);

  return (
    <ProgramToolbarRows
      bold={bold}
      italic={italic}
      underline={underline}
      canUndo={canUndo}
      canRedo={canRedo}
      setBlock={setBlock}
      fmt={fmt}
      undo={() => cmd(UNDO_COMMAND)}
      redo={() => cmd(REDO_COMMAND)}
      insertUnordered={() => cmd(INSERT_UNORDERED_LIST_COMMAND)}
      insertOrdered={() => cmd(INSERT_ORDERED_LIST_COMMAND)}
      {...(variables ? { variables } : {})}
      {...(groupLabels ? { groupLabels } : {})}
    />
  );
}
