import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { COMMAND_PRIORITY_EDITOR, createCommand, type LexicalCommand } from "lexical";
import { $insertNodeToNearestRoot } from "@lexical/utils";
import { $createImageNode } from "../nodes/ImageNode";

interface InsertImagePayload {
  src: string;
  alt: string;
  widthPct?: number;
  caption?: string;
}

/** Command host editors can dispatch to drop an image into the
 *  document at the current selection. The slash command and the
 *  brass-ornament preset both fire this same command. */
export const INSERT_IMAGE_COMMAND: LexicalCommand<InsertImagePayload> =
  createCommand("INSERT_IMAGE_COMMAND");

/** Listens for `INSERT_IMAGE_COMMAND` and inserts an `ImageNode` at
 *  the nearest root location. Mounted by `PageEditorComposer` so any
 *  WYSIWYG surface gains image insertion for free. */
export function ImagePlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        const node = $createImageNode(payload);
        $insertNodeToNearestRoot(node);
        return true;
      },
      COMMAND_PRIORITY_EDITOR,
    );
  }, [editor]);
  return null;
}
