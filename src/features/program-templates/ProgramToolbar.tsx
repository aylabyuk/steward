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
// prettier-ignore
import { Bold, Heading1, Heading2, Heading3, Italic, List, ListOrdered, Pilcrow, Quote, Redo2, Underline, Undo2 } from "lucide-react";
import { InsertVariableMenu } from "./InsertVariableMenu";
import { ProgramToolbarButton, ToolbarSep } from "./ProgramToolbarButton";
import type { ProgramVariable } from "./utils/programVariables";

const I = { size: 16, strokeWidth: 1.75 } as const;
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

  const fmt = (m: "bold" | "italic" | "underline") => editor.dispatchCommand(FORMAT_TEXT_COMMAND, m);
  const cmd = (c: typeof UNDO_COMMAND) => editor.dispatchCommand(c, undefined);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border flex-wrap">
      <ProgramToolbarButton ariaLabel="Undo" disabled={!canUndo} label={<Undo2 {...I} />} onClick={() => cmd(UNDO_COMMAND)} />
      <ProgramToolbarButton ariaLabel="Redo" disabled={!canRedo} label={<Redo2 {...I} />} onClick={() => cmd(REDO_COMMAND)} />
      <ToolbarSep />
      <ProgramToolbarButton ariaLabel="Paragraph" label={<Pilcrow {...I} />} onClick={() => setBlock("p")} />
      <ProgramToolbarButton ariaLabel="Heading 1" label={<Heading1 {...I} />} onClick={() => setBlock("h1")} />
      <ProgramToolbarButton ariaLabel="Heading 2" label={<Heading2 {...I} />} onClick={() => setBlock("h2")} />
      <ProgramToolbarButton ariaLabel="Heading 3" label={<Heading3 {...I} />} onClick={() => setBlock("h3")} />
      <ProgramToolbarButton ariaLabel="Quote" label={<Quote {...I} />} onClick={() => setBlock("quote")} />
      <ToolbarSep />
      <ProgramToolbarButton ariaLabel="Bulleted list" label={<List {...I} />} onClick={() => cmd(INSERT_UNORDERED_LIST_COMMAND)} />
      <ProgramToolbarButton ariaLabel="Numbered list" label={<ListOrdered {...I} />} onClick={() => cmd(INSERT_ORDERED_LIST_COMMAND)} />
      <ToolbarSep />
      <ProgramToolbarButton ariaLabel="Bold" active={bold} ariaPressed={bold} label={<Bold {...I} />} onClick={() => fmt("bold")} />
      <ProgramToolbarButton ariaLabel="Italic" active={italic} ariaPressed={italic} label={<Italic {...I} />} onClick={() => fmt("italic")} />
      <ProgramToolbarButton ariaLabel="Underline" active={underline} ariaPressed={underline} label={<Underline {...I} />} onClick={() => fmt("underline")} />
      {variables && groupLabels && (
        <>
          <ToolbarSep />
          <InsertVariableMenu variables={variables} groupLabels={groupLabels} />
        </>
      )}
    </div>
  );
}
