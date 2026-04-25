import { useEffect, useState } from "react";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  type ElementFormatType,
  type LexicalEditor,
} from "lexical";
import { $isLinkNode } from "@lexical/link";
import { $isListNode } from "@lexical/list";
import { $isHeadingNode, $isQuoteNode } from "@lexical/rich-text";
import { $getSelectionStyleValueForProperty } from "@lexical/selection";

export type BlockType = "paragraph" | "h1" | "h2" | "h3" | "quote" | "bullet" | "number";

export interface ToolbarState {
  blockType: BlockType;
  align: ElementFormatType;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
  link: boolean;
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bgColor: string;
  canUndo: boolean;
  canRedo: boolean;
}

const EMPTY: ToolbarState = {
  blockType: "paragraph",
  align: "left",
  bold: false,
  italic: false,
  underline: false,
  strikethrough: false,
  code: false,
  link: false,
  fontFamily: "Newsreader",
  fontSize: 16,
  fontColor: "#3B2A22",
  bgColor: "transparent",
  canUndo: false,
  canRedo: false,
};

/** Listens to Lexical's selection / undo / redo commands and surfaces
 *  the current toolbar-relevant state — block type, alignment, every
 *  text format, the active font/size/color so each control can paint
 *  its own active state and seed its picker with what's on screen. */
export function useToolbarState(editor: LexicalEditor): ToolbarState {
  const [state, setState] = useState<ToolbarState>(EMPTY);

  useEffect(() => {
    const update = () => {
      editor.getEditorState().read(() => {
        const sel = $getSelection();
        if (!$isRangeSelection(sel)) return;
        const anchorNode = sel.anchor.getNode();
        const elementNode =
          anchorNode.getKey() === "root" ? anchorNode : anchorNode.getTopLevelElementOrThrow();
        let blockType: BlockType = "paragraph";
        if ($isHeadingNode(elementNode)) blockType = elementNode.getTag() as BlockType;
        else if ($isQuoteNode(elementNode)) blockType = "quote";
        else if ($isListNode(elementNode))
          blockType = elementNode.getListType() === "number" ? "number" : "bullet";
        const parent = anchorNode.getParent();
        const align = (elementNode.getFormatType?.() ?? "left") as ElementFormatType;
        let fontFamily = EMPTY.fontFamily;
        let fontSize = EMPTY.fontSize;
        let fontColor = EMPTY.fontColor;
        let bgColor = EMPTY.bgColor;
        try {
          fontFamily =
            $getSelectionStyleValueForProperty(sel, "font-family", "Newsreader") || fontFamily;
          const sz = $getSelectionStyleValueForProperty(sel, "font-size", "16px") || "16px";
          fontSize = parseInt(sz, 10) || fontSize;
          fontColor = $getSelectionStyleValueForProperty(sel, "color", "#3B2A22") || fontColor;
          bgColor =
            $getSelectionStyleValueForProperty(sel, "background-color", "transparent") || bgColor;
        } catch {
          /* ignore — selection style probe can throw on synthetic selections */
        }
        setState((s) => ({
          ...s,
          blockType,
          align: align || "left",
          bold: sel.hasFormat("bold"),
          italic: sel.hasFormat("italic"),
          underline: sel.hasFormat("underline"),
          strikethrough: sel.hasFormat("strikethrough"),
          code: sel.hasFormat("code"),
          link: $isLinkNode(parent) || $isLinkNode(anchorNode),
          fontFamily,
          fontSize,
          fontColor,
          bgColor,
        }));
      });
    };
    return mergeRegister(
      editor.registerUpdateListener(update),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_UNDO_COMMAND,
        (canUndo) => {
          setState((s) => ({ ...s, canUndo }));
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
      editor.registerCommand(
        CAN_REDO_COMMAND,
        (canRedo) => {
          setState((s) => ({ ...s, canRedo }));
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor]);

  return state;
}
