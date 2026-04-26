import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { FORMAT_TEXT_COMMAND, REDO_COMMAND, UNDO_COMMAND } from "lexical";
import { TOGGLE_LINK_COMMAND } from "@lexical/link";
import type { LetterPageStyle } from "@/lib/types/template";
import "./toolbar.css";
import { AlignmentDropdown } from "./AlignmentDropdown";
import { BlockTypeDropdown } from "./BlockTypeDropdown";
import { CaseFormatMenu } from "./CaseFormatMenu";
import { BgColorPicker, FontColorPicker } from "./ColorPickers";
import { FontFamilyDropdown } from "./FontFamilyDropdown";
import { FontSizeStepper } from "./FontSizeStepper";
import { Icon } from "./Icon";
import { InsertMenu } from "./InsertMenu";
import { PageSetupPopover } from "./PageSetupPopover";
import { ToolbarButton, ToolbarSep } from "./ToolbarButton";
import { useToolbarState } from "./useToolbarState";
import { VariableMenu, type VariableEntry } from "./VariableMenu";
import { ZoomMenu, type ZoomMode } from "./ZoomMenu";
import type { SlashCommand } from "../plugins/SlashCommandRegistry";

interface Props {
  slashCommands: ReadonlyArray<SlashCommand>;
  /** Optional palette of `{{token}}` variables. When provided, the
   *  toolbar surfaces a Variables dropdown next to Insert; the editor's
   *  Insert / slash menu stays free of token rows. */
  variables?: ReadonlyArray<VariableEntry>;
  variableGroupLabels?: Record<string, string>;
  pageStyle?: LetterPageStyle | null;
  onPageStyleChange?: (next: LetterPageStyle) => void;
  zoom?: number;
  zoomMode?: ZoomMode;
  onZoomMode?: (next: ZoomMode) => void;
}

/** Page-level toolbar — pixel-faithful port of the bishopric-pwa
 *  design kit's editor toolbar. Order: Undo / Redo · Block type ·
 *  Font family · Font size · B / I / U / S / code / link · Text
 *  color · Highlight · Case + format · Insert · (spacer) · Align ·
 *  Zoom · Page setup · Print. */
export function PageToolbar({
  slashCommands,
  variables,
  variableGroupLabels,
  pageStyle,
  onPageStyleChange,
  zoom,
  zoomMode,
  onZoomMode,
}: Props) {
  const [editor] = useLexicalComposerContext();
  const s = useToolbarState(editor);
  return (
    <div className="tb-toolbar" role="toolbar" aria-label="Editor formatting">
      <ToolbarButton
        label="Undo (⌘Z)"
        disabled={!s.canUndo}
        onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
      >
        <Icon name="undo" />
      </ToolbarButton>
      <ToolbarButton
        label="Redo (⌘⇧Z)"
        disabled={!s.canRedo}
        onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
      >
        <Icon name="redo" />
      </ToolbarButton>
      <ToolbarSep />

      <BlockTypeDropdown editor={editor} current={s.blockType} />
      <ToolbarSep />

      <FontFamilyDropdown editor={editor} current={s.fontFamily} />
      <FontSizeStepper editor={editor} current={s.fontSize} />
      <ToolbarSep />

      <ToolbarButton
        label="Bold (⌘B)"
        active={s.bold}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold")}
      >
        <Icon name="bold" sw={3} />
      </ToolbarButton>
      <ToolbarButton
        label="Italic (⌘I)"
        active={s.italic}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic")}
      >
        <Icon name="italic" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline (⌘U)"
        active={s.underline}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline")}
      >
        <Icon name="underline" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={s.strikethrough}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "strikethrough")}
      >
        <Icon name="strike" />
      </ToolbarButton>
      <ToolbarButton
        label="Inline code"
        active={s.code}
        onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, "code")}
      >
        <Icon name="code" />
      </ToolbarButton>
      <ToolbarButton
        label={s.link ? "Remove link" : "Add link"}
        active={s.link}
        onClick={() => {
          if (s.link) {
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            return;
          }
          const url = window.prompt("Enter URL", "https://");
          if (url) editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
        }}
      >
        <Icon name="link" />
      </ToolbarButton>
      <ToolbarSep />

      <FontColorPicker editor={editor} current={s.fontColor} />
      <BgColorPicker editor={editor} current={s.bgColor} />
      <CaseFormatMenu editor={editor} />
      <ToolbarSep />

      <InsertMenu editor={editor} commands={slashCommands} />
      {variables && variables.length > 0 && (
        <VariableMenu
          editor={editor}
          variables={variables}
          groupLabels={variableGroupLabels ?? {}}
        />
      )}

      <span className="tb-spacer" />

      <AlignmentDropdown editor={editor} current={s.align} />
      <ToolbarSep />

      {zoom !== undefined && zoomMode && onZoomMode && (
        <ZoomMenu zoom={zoom} mode={zoomMode} onMode={onZoomMode} />
      )}
      {onPageStyleChange && <PageSetupPopover value={pageStyle} onChange={onPageStyleChange} />}
      <ToolbarButton label="Print" onClick={() => window.print()}>
        <Icon name="printer" sw={1.6} />
      </ToolbarButton>
    </div>
  );
}
