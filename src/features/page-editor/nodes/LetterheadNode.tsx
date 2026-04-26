import { useState } from "react";
import {
  $applyNodeReplacement,
  $getNodeByKey,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { interpolate } from "@/features/templates/interpolate";
import { EditPropModal } from "../EditPropModal";
import { useLetterVars } from "../letterRenderContext";
import { LETTER_VARIABLES } from "../letterVariables";

export type SerializedLetterheadNode = Spread<
  { title: string; subtitle: string; meta: string },
  SerializedLexicalNode
>;

const DEFAULT_TITLE = "Ward Name";
const DEFAULT_SUBTITLE = "The Bishopric";
const DEFAULT_META = "";

/** Masthead-style letterhead block — a formal top-of-letter
 *  identification panel. Renders as a brass double-rule sandwich
 *  around a wide-letter-spaced display title, an ornament-flanked
 *  mono subtitle, and an optional centered meta line for date or
 *  contact info. Visually distinct from the existing centered
 *  "✦ / eyebrow / title / sub-eyebrow / date" stack so a bishop can
 *  pick whichever opener matches the letter's tone. */
export class LetterheadNode extends DecoratorNode<React.ReactElement> {
  __title: string;
  __subtitle: string;
  __meta: string;

  static getType(): string {
    return "letterhead";
  }

  static clone(node: LetterheadNode): LetterheadNode {
    return new LetterheadNode(node.__title, node.__subtitle, node.__meta, node.__key);
  }

  constructor(
    title = DEFAULT_TITLE,
    subtitle = DEFAULT_SUBTITLE,
    meta = DEFAULT_META,
    key?: NodeKey,
  ) {
    super(key);
    this.__title = title;
    this.__subtitle = subtitle;
    this.__meta = meta;
  }

  isInline(): boolean {
    return false;
  }
  isKeyboardSelectable(): boolean {
    return true;
  }

  setTitle(title: string): void {
    this.getWritable().__title = title;
  }
  setSubtitle(subtitle: string): void {
    this.getWritable().__subtitle = subtitle;
  }
  setMeta(meta: string): void {
    this.getWritable().__meta = meta;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const div = document.createElement("div");
    div.style.display = "block";
    return div;
  }
  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const div = document.createElement("div");
    div.setAttribute("data-letterhead", "true");
    div.setAttribute("data-title", this.__title);
    div.setAttribute("data-subtitle", this.__subtitle);
    div.setAttribute("data-meta", this.__meta);
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (el: HTMLElement) => {
        if (el.getAttribute("data-letterhead") !== "true") return null;
        return {
          conversion: () => ({
            node: $createLetterheadNode(
              el.getAttribute("data-title") ?? DEFAULT_TITLE,
              el.getAttribute("data-subtitle") ?? DEFAULT_SUBTITLE,
              el.getAttribute("data-meta") ?? DEFAULT_META,
            ),
          }),
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedLetterheadNode {
    return {
      type: LetterheadNode.getType(),
      version: 1,
      title: this.__title,
      subtitle: this.__subtitle,
      meta: this.__meta,
    };
  }

  static importJSON(json: SerializedLetterheadNode): LetterheadNode {
    return $createLetterheadNode(
      json.title ?? DEFAULT_TITLE,
      json.subtitle ?? DEFAULT_SUBTITLE,
      json.meta ?? DEFAULT_META,
    );
  }

  decorate(): React.ReactElement {
    return (
      <LetterheadView
        nodeKey={this.__key}
        title={this.__title}
        subtitle={this.__subtitle}
        meta={this.__meta}
      />
    );
  }
}

function LetterheadView({
  nodeKey,
  title,
  subtitle,
  meta,
}: {
  nodeKey: NodeKey;
  title: string;
  subtitle: string;
  meta: string;
}) {
  const [editor] = useLexicalComposerContext();
  const vars = useLetterVars();
  const [editing, setEditing] = useState<"title" | "subtitle" | "meta" | null>(null);

  function save(next: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!(node instanceof LetterheadNode)) return;
      if (editing === "title") node.setTitle(next.trim() || DEFAULT_TITLE);
      else if (editing === "subtitle") node.setSubtitle(next.trim() || DEFAULT_SUBTITLE);
      else if (editing === "meta") node.setMeta(next.trim());
    });
    setEditing(null);
  }

  const titles = {
    title: "Edit letterhead title",
    subtitle: "Edit subtitle",
    meta: "Edit meta line (leave empty to hide)",
  } as const;

  return (
    <>
      <div contentEditable={false} className="select-none my-3 text-center">
        <button
          type="button"
          onClick={() => setEditing("title")}
          className="block w-full font-display text-[17px] tracking-[0.24em] uppercase text-walnut hover:underline focus:outline-none"
        >
          {interpolate(title, vars)}
        </button>
        <div className="mt-1 inline-flex items-center gap-2 font-mono text-[9.5px] tracking-[0.18em] uppercase text-walnut-3">
          <button
            type="button"
            onClick={() => setEditing("subtitle")}
            className="hover:underline focus:outline-none"
          >
            {interpolate(subtitle, vars)}
          </button>
          <button
            type="button"
            onClick={() => setEditing("meta")}
            className="hover:underline focus:outline-none text-walnut-3/80"
          >
            {meta ? `· ${interpolate(meta, vars)}` : "· + meta"}
          </button>
        </div>
        <div className="mt-2 mx-auto h-px w-12 bg-brass/60" />
      </div>
      <EditPropModal
        open={editing !== null}
        title={editing ? titles[editing] : ""}
        initial={editing === "title" ? title : editing === "subtitle" ? subtitle : meta}
        variables={LETTER_VARIABLES}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    </>
  );
}

export function $createLetterheadNode(
  title?: string,
  subtitle?: string,
  meta?: string,
): LetterheadNode {
  return $applyNodeReplacement(new LetterheadNode(title, subtitle, meta));
}

export function $isLetterheadNode(node: LexicalNode | null | undefined): node is LetterheadNode {
  return node instanceof LetterheadNode;
}
