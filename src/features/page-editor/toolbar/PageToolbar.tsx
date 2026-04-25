import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import type { LetterPageStyle } from "@/lib/types/template";
import { AlignmentDropdown } from "./AlignmentDropdown";
import { BlockTypeDropdown } from "./BlockTypeDropdown";
import { InsertMenu } from "./InsertMenu";
import { PageSizeDropdown } from "./PageSizeDropdown";
import { ToolbarButton, ToolbarSep } from "./ToolbarButton";
import { useToolbarState } from "./useToolbarState";
import { ZoomControls } from "./ZoomControls";
import type { SlashCommand } from "../plugins/SlashCommandRegistry";

interface Props {
  /** Slash-command registry — surfaced through the Insert menu in the
   *  toolbar so the bishop can drop blocks via click as well as via
   *  the typeahead. */
  slashCommands: ReadonlyArray<SlashCommand>;
  /** Page-style controls. Omit `onPageStyleChange` to hide the
   *  page-size dropdown (e.g. read-only contexts, the wizard's
   *  per-speaker preview where size is fixed). */
  pageStyle?: LetterPageStyle | null;
  onPageStyleChange?: (next: LetterPageStyle) => void;
  /** Zoom factor + setter. Omit to hide the zoom group. */
  zoom?: number;
  onZoomChange?: (next: number) => void;
}

/** Sticky page-level toolbar — playground-style controls that always
 *  apply to the active selection. The floating-selection toolbar
 *  shows quick formats above the cursor; this stays anchored to the
 *  editor for block-level moves (alignment, block type, insert) and
 *  page-level decisions (size, orientation). */
export function PageToolbar({
  slashCommands,
  pageStyle,
  onPageStyleChange,
  zoom,
  onZoomChange,
}: Props) {
  const [editor] = useLexicalComposerContext();
  const s = useToolbarState(editor);
  return (
    <div className="sticky top-0 z-20 flex items-center gap-1 flex-wrap bg-parchment-2 border-b border-border-strong px-3 py-1.5 shadow-[0_1px_0_var(--color-border)] w-full">
      <ToolbarButton
        label="Undo (⌘Z)"
        disabled={!s.canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        ↶
      </ToolbarButton>
      <ToolbarButton
        label="Redo (⌘⇧Z)"
        disabled={!s.canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        ↷
      </ToolbarButton>
      <ToolbarSep />
      <BlockTypeDropdown editor={editor} current={s.blockType} />
      <ToolbarSep />
      <ToolbarButton
        label="Bold (⌘B)"
        active={s.bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
        className="font-semibold"
      >
        B
      </ToolbarButton>
      <ToolbarButton
        label="Italic (⌘I)"
        active={s.italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
        className="italic"
      >
        I
      </ToolbarButton>
      <ToolbarButton
        label="Underline (⌘U)"
        active={s.underline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
        className="underline"
      >
        U
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={s.strikethrough}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
        className="line-through"
      >
        S
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={s.code}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
        className="font-mono text-[11px]"
      >
        {"</>"}
      </ToolbarButton>
      <ToolbarButton
        label={s.link ? "Remove link" : "Add link"}
        active={s.link}
        onClick={() => {
          if (s.link) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            return;
          }
          const url = window.prompt("Link URL", "https://");
          if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }}
      >
        🔗
      </ToolbarButton>
      <ToolbarSep />
      <AlignmentDropdown editor={editor} current={s.align} />
      <ToolbarSep />
      <InsertMenu editor={editor} commands={slashCommands} />
      <span className="flex-1" />
      {zoom !== undefined && onZoomChange && <ZoomControls zoom={zoom} onChange={onZoomChange} />}
      {onPageStyleChange && (
        <>
          <ToolbarSep />
          <PageSizeDropdown value={pageStyle} onChange={onPageStyleChange} />
        </>
      )}
    </div>
  );
}
