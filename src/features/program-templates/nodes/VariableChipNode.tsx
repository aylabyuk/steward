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
  type TextFormatType,
} from "lexical";
import { parseStyleString, stringifyStyle, variableChipFormatBit } from "./chipStyle";
import { VariableChipView } from "./VariableChipView";

export { variableChipFormatBit } from "./chipStyle";

export type SerializedVariableChipNode = Spread<
  { token: string; format?: number; style?: string },
  SerializedLexicalNode
>;

/** Inline decorator node: a "chip" representing a `{{token}}`
 *  reference in the editor. Renders as the resolved sample value
 *  (e.g. `Brother Park` instead of `{{speakerName}}`) so the bishop
 *  sees what the letter would actually look like. Visually
 *  indistinguishable from authored text by default; a soft brass
 *  hover treatment surfaces the "this is dynamic" hint and clicking
 *  opens a picker to swap the variable.
 *
 *  Carries a Lexical-style format bitmask so toolbar formatting
 *  (bold / italic / underline / etc) round-trips through the chip
 *  via the companion VariableChipFormatPlugin. */
export class VariableChipNode extends DecoratorNode<React.ReactElement> {
  __token: string;
  __format: number;
  __style: string;

  static getType(): string {
    return "variable-chip";
  }

  static clone(node: VariableChipNode): VariableChipNode {
    return new VariableChipNode(node.__token, node.__format, node.__style, node.__key);
  }

  constructor(token: string, format = 0, style = "", key?: NodeKey) {
    super(key);
    this.__token = token;
    this.__format = format;
    this.__style = style;
  }

  getToken(): string {
    return this.__token;
  }
  setToken(token: string): void {
    this.getWritable().__token = token;
  }

  getFormat(): number {
    return this.getLatest().__format;
  }
  setFormat(format: number): void {
    this.getWritable().__format = format;
  }
  hasFormat(type: TextFormatType): boolean {
    const bit = variableChipFormatBit(type);
    return bit !== 0 && (this.getFormat() & bit) !== 0;
  }
  toggleFormat(type: TextFormatType): void {
    const bit = variableChipFormatBit(type);
    if (bit === 0) return;
    this.setFormat(this.getFormat() ^ bit);
  }

  getStyle(): string {
    return this.getLatest().__style;
  }
  setStyle(style: string): void {
    this.getWritable().__style = style;
  }
  /** Read a single CSS property value out of `__style`. Returns ""
   *  when the property isn't set so callers can use a falsy check. */
  getCSSProperty(property: string): string {
    return parseStyleString(this.getStyle())[property] ?? "";
  }
  /** Mirror of `$patchStyleText`'s per-property update for a single
   *  chip. Pass `null` as the value to remove the property. */
  patchStyle(patch: Record<string, string | null>): void {
    const next = { ...parseStyleString(this.getStyle()) };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete next[k];
      else next[k] = v;
    }
    this.setStyle(stringifyStyle(next));
  }

  isInline(): boolean {
    return true;
  }
  isKeyboardSelectable(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline";
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
      version: 3,
      token: this.__token,
      format: this.__format,
      style: this.__style,
    };
  }

  static importJSON(json: SerializedVariableChipNode): VariableChipNode {
    return $createVariableChipNode(json.token, json.format ?? 0, json.style ?? "");
  }

  decorate(): React.ReactElement {
    return (
      <VariableChipView
        nodeKey={this.__key}
        token={this.__token}
        format={this.__format}
        style={this.__style}
      />
    );
  }
}

export function $createVariableChipNode(token: string, format = 0, style = ""): VariableChipNode {
  return $applyNodeReplacement(new VariableChipNode(token, format, style));
}

export function $isVariableChipNode(
  node: LexicalNode | null | undefined,
): node is VariableChipNode {
  return node instanceof VariableChipNode;
}
