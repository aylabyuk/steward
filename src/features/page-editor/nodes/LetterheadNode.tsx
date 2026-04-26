import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type NodeKey,
  type SerializedLexicalNode,
  type Spread,
} from "lexical";
import { LetterheadView } from "./LetterheadView";

export type SerializedLetterheadNode = Spread<
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    /** Legacy fields from the previous masthead-style letterhead;
     *  kept on the serialized type so old saves round-trip during
     *  migration. importJSON folds them into the new slots. */
    meta?: string;
  },
  SerializedLexicalNode
>;

export const DEFAULT_EYEBROW = "Sacrament Meeting · {{wardName}}";
export const DEFAULT_TITLE = "Invitation to Speak";
export const DEFAULT_SUBTITLE = "From the Bishopric";

/** Letter-opening header — circled brass ornament, mono eyebrow,
 *  italic display title, mono sub-eyebrow, finished with a single
 *  divider rule. Three click-to-edit text fields; the ornament is
 *  decoration-only. {{token}} interpolation runs through every
 *  field so the bishop can author "Sacrament Meeting ·
 *  {{wardName}}" once and have it resolve per-render. */
export class LetterheadNode extends DecoratorNode<React.ReactElement> {
  __eyebrow: string;
  __title: string;
  __subtitle: string;

  static getType(): string {
    return "letterhead";
  }

  static clone(node: LetterheadNode): LetterheadNode {
    return new LetterheadNode(node.__eyebrow, node.__title, node.__subtitle, node.__key);
  }

  constructor(
    eyebrow = DEFAULT_EYEBROW,
    title = DEFAULT_TITLE,
    subtitle = DEFAULT_SUBTITLE,
    key?: NodeKey,
  ) {
    super(key);
    this.__eyebrow = eyebrow;
    this.__title = title;
    this.__subtitle = subtitle;
  }

  isInline(): boolean {
    return false;
  }
  isKeyboardSelectable(): boolean {
    return true;
  }

  setEyebrow(v: string): void {
    this.getWritable().__eyebrow = v;
  }
  setTitle(v: string): void {
    this.getWritable().__title = v;
  }
  setSubtitle(v: string): void {
    this.getWritable().__subtitle = v;
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
    div.setAttribute("data-eyebrow", this.__eyebrow);
    div.setAttribute("data-title", this.__title);
    div.setAttribute("data-subtitle", this.__subtitle);
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (el: HTMLElement) => {
        if (el.getAttribute("data-letterhead") !== "true") return null;
        return {
          conversion: () => ({
            node: $createLetterheadNode(
              el.getAttribute("data-eyebrow") ?? DEFAULT_EYEBROW,
              el.getAttribute("data-title") ?? DEFAULT_TITLE,
              el.getAttribute("data-subtitle") ?? DEFAULT_SUBTITLE,
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
      version: 2,
      eyebrow: this.__eyebrow,
      title: this.__title,
      subtitle: this.__subtitle,
    };
  }

  static importJSON(json: SerializedLetterheadNode): LetterheadNode {
    // Soft migration from v1 schema (title / subtitle / meta layout):
    // v1.title was the masthead caps (mapped to v2.eyebrow), v1.subtitle
    // was the brass-flanked line (mapped to v2.subtitle), v1.meta
    // dropped because v2 has no fourth slot.
    const eyebrow = json.eyebrow ?? DEFAULT_EYEBROW;
    const title = json.title ?? DEFAULT_TITLE;
    const subtitle = json.subtitle ?? DEFAULT_SUBTITLE;
    return $createLetterheadNode(eyebrow, title, subtitle);
  }

  decorate(): React.ReactElement {
    return (
      <LetterheadView
        nodeKey={this.__key}
        eyebrow={this.__eyebrow}
        title={this.__title}
        subtitle={this.__subtitle}
      />
    );
  }
}

export function $createLetterheadNode(
  eyebrow?: string,
  title?: string,
  subtitle?: string,
): LetterheadNode {
  return $applyNodeReplacement(new LetterheadNode(eyebrow, title, subtitle));
}

export function $isLetterheadNode(node: LexicalNode | null | undefined): node is LetterheadNode {
  return node instanceof LetterheadNode;
}
