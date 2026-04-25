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
import { VARIABLE_BY_TOKEN } from "../programVariables";

export type SerializedVariableChipNode = Spread<{ token: string }, SerializedLexicalNode>;

/** Inline decorator node: a "chip" that represents a `{{token}}`
 *  reference inside the program template. Stored as a structured
 *  node (not as plain text), so it can't be partially typed-into,
 *  drag-deletes as a single unit, and renders with a custom React
 *  component the bishopric can recognise at a glance. */
export class VariableChipNode extends DecoratorNode<React.ReactElement> {
  __token: string;

  static getType(): string {
    return "variable-chip";
  }

  static clone(node: VariableChipNode): VariableChipNode {
    return new VariableChipNode(node.__token, node.__key);
  }

  constructor(token: string, key?: NodeKey) {
    super(key);
    this.__token = token;
  }

  getToken(): string {
    return this.__token;
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const span = document.createElement("span");
    span.setAttribute("data-variable-chip", this.__token);
    span.textContent = `{{${this.__token}}}`;
    return { element: span };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      span: (el: HTMLElement) => {
        const token = el.getAttribute("data-variable-chip");
        if (!token) return null;
        return {
          conversion: () => ({ node: $createVariableChipNode(token) }),
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedVariableChipNode {
    return {
      type: VariableChipNode.getType(),
      version: 1,
      token: this.__token,
    };
  }

  static importJSON(json: SerializedVariableChipNode): VariableChipNode {
    return $createVariableChipNode(json.token);
  }

  /** What to render in place of this node inside the editor. */
  decorate(): React.ReactElement {
    const meta = VARIABLE_BY_TOKEN.get(this.__token);
    const label = meta?.label ?? this.__token;
    const sample = meta?.sample ?? "";
    return (
      <span
        contentEditable={false}
        title={sample ? `Renders as: ${sample}` : undefined}
        className="inline-flex items-center gap-1 align-baseline rounded-full border border-bordeaux/40 bg-bordeaux/10 px-2 py-0.5 font-mono text-[11px] text-bordeaux-deep select-none"
      >
        <span className="opacity-60">{"{{"}</span>
        <span>{label}</span>
        <span className="opacity-60">{"}}"}</span>
      </span>
    );
  }
}

export function $createVariableChipNode(token: string): VariableChipNode {
  return $applyNodeReplacement(new VariableChipNode(token));
}

export function $isVariableChipNode(
  node: LexicalNode | null | undefined,
): node is VariableChipNode {
  return node instanceof VariableChipNode;
}
