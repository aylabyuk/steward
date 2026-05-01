import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Redo2,
  Underline,
  Undo2,
} from "lucide-react";
import { InsertVariableMenu } from "./InsertVariableMenu";
import { ProgramToolbarButton, ToolbarSep } from "./ProgramToolbarButton";
import type { ProgramVariable } from "./utils/programVariables";

const I = { size: 16, strokeWidth: 1.75 } as const;
type BlockKind = "p" | "h1" | "h2" | "h3" | "quote";

interface Props {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  canUndo: boolean;
  canRedo: boolean;
  setBlock: (kind: BlockKind) => void;
  fmt: (mode: "bold" | "italic" | "underline") => void;
  undo: () => void;
  redo: () => void;
  insertUnordered: () => void;
  insertOrdered: () => void;
  variables?: readonly ProgramVariable[];
  groupLabels?: Readonly<Record<string, string>>;
}

/** Pure render of the toolbar's button rows. Split out of
 *  `ProgramToolbar` so the parent stays under the per-file LOC cap;
 *  parent owns the editor / format state and hands the handlers in. */
export function ProgramToolbarRows({
  bold,
  italic,
  underline,
  canUndo,
  canRedo,
  setBlock,
  fmt,
  undo,
  redo,
  insertUnordered,
  insertOrdered,
  variables,
  groupLabels,
}: Props) {
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border flex-wrap">
      <ProgramToolbarButton
        ariaLabel="Undo"
        disabled={!canUndo}
        label={<Undo2 {...I} />}
        onClick={undo}
      />
      <ProgramToolbarButton
        ariaLabel="Redo"
        disabled={!canRedo}
        label={<Redo2 {...I} />}
        onClick={redo}
      />
      <ToolbarSep />
      <ProgramToolbarButton
        ariaLabel="Paragraph"
        label={<Pilcrow {...I} />}
        onClick={() => setBlock("p")}
      />
      <ProgramToolbarButton
        ariaLabel="Heading 1"
        label={<Heading1 {...I} />}
        onClick={() => setBlock("h1")}
      />
      <ProgramToolbarButton
        ariaLabel="Heading 2"
        label={<Heading2 {...I} />}
        onClick={() => setBlock("h2")}
      />
      <ProgramToolbarButton
        ariaLabel="Heading 3"
        label={<Heading3 {...I} />}
        onClick={() => setBlock("h3")}
      />
      <ProgramToolbarButton
        ariaLabel="Quote"
        label={<Quote {...I} />}
        onClick={() => setBlock("quote")}
      />
      <ToolbarSep />
      <ProgramToolbarButton
        ariaLabel="Bulleted list"
        label={<List {...I} />}
        onClick={insertUnordered}
      />
      <ProgramToolbarButton
        ariaLabel="Numbered list"
        label={<ListOrdered {...I} />}
        onClick={insertOrdered}
      />
      <ToolbarSep />
      <ProgramToolbarButton
        ariaLabel="Bold"
        active={bold}
        ariaPressed={bold}
        label={<Bold {...I} />}
        onClick={() => fmt("bold")}
      />
      <ProgramToolbarButton
        ariaLabel="Italic"
        active={italic}
        ariaPressed={italic}
        label={<Italic {...I} />}
        onClick={() => fmt("italic")}
      />
      <ProgramToolbarButton
        ariaLabel="Underline"
        active={underline}
        ariaPressed={underline}
        label={<Underline {...I} />}
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
