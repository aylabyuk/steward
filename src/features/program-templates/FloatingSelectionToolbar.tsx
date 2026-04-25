import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { mergeRegister } from "@lexical/utils";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import { $isLinkNode } from "@lexical/link";
import { type ActiveFormats, EMPTY_FORMATS, ToolbarButtons } from "./floatingToolbarButtons";

const VERTICAL_GAP = 10;
const VIEWPORT_PADDING = 8;
const FALLBACK_HEIGHT = 36;
const FALLBACK_WIDTH = 320;

/** Floating selection toolbar that appears above a non-collapsed text
 *  selection, à la the Lexical playground. Mounted as a Lexical
 *  plugin so it can read selection state directly; rendered via a
 *  portal at `document.body` so it isn't clipped by the editor's
 *  scroll container. Mount alongside `LinkPlugin` so the link button
 *  has a target for `TOGGLE_LINK_COMMAND`. */
export function FloatingSelectionToolbar() {
  const [editor] = useLexicalComposerContext();
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [active, setActive] = useState<ActiveFormats>(EMPTY_FORMATS);
  const ref = useRef<HTMLDivElement>(null);

  const update = useCallback(() => {
    const sel = $getSelection();
    if (!$isRangeSelection(sel) || sel.isCollapsed()) {
      setPos(null);
      return;
    }
    const native = window.getSelection();
    if (!native || native.rangeCount === 0 || native.isCollapsed) {
      setPos(null);
      return;
    }
    const rect = native.getRangeAt(0).getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      setPos(null);
      return;
    }
    const tw = ref.current?.offsetWidth ?? FALLBACK_WIDTH;
    const th = ref.current?.offsetHeight ?? FALLBACK_HEIGHT;
    const left = Math.max(
      VIEWPORT_PADDING,
      Math.min(window.innerWidth - tw - VIEWPORT_PADDING, rect.left + rect.width / 2 - tw / 2),
    );
    const top = rect.top - th - VERTICAL_GAP;
    setPos({ top: top < VIEWPORT_PADDING ? rect.bottom + VERTICAL_GAP : top, left });
    const node = sel.anchor.getNode();
    const parent = node.getParent();
    setActive({
      bold: sel.hasFormat("bold"),
      italic: sel.hasFormat("italic"),
      underline: sel.hasFormat("underline"),
      strikethrough: sel.hasFormat("strikethrough"),
      subscript: sel.hasFormat("subscript"),
      superscript: sel.hasFormat("superscript"),
      code: sel.hasFormat("code"),
      link: $isLinkNode(parent) || $isLinkNode(node),
    });
  }, []);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => editorState.read(update)),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          update();
          return false;
        },
        COMMAND_PRIORITY_LOW,
      ),
    );
  }, [editor, update]);

  useEffect(() => {
    if (!pos) return;
    const onScroll = () => editor.getEditorState().read(update);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [pos, editor, update]);

  if (!pos) return null;
  return createPortal(
    <div
      ref={ref}
      role="toolbar"
      aria-label="Text formatting"
      style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 inline-flex items-center rounded-full border border-border-strong bg-chalk shadow-elev-3 px-1 py-1 gap-0.5"
      onMouseDown={(e) => e.preventDefault()}
    >
      <ToolbarButtons editor={editor} active={active} />
    </div>,
    document.body,
  );
}
