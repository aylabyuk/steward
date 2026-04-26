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
import { SignatureBlockView } from "./SignatureBlockView";

export type SerializedSignatureBlockNode = Spread<
  { closing: string; signatory: string },
  SerializedLexicalNode
>;

export const DEFAULT_CLOSING = "With gratitude,";
export const DEFAULT_SIGNATORY = "The Bishopric";

/** Block-level decorator that renders the closing-of-letter signature
 *  line: a soft phrase ("With gratitude,"), a short walnut underline,
 *  and the signatory in uppercase mono ("The Bishopric"). Promoted
 *  from chrome to a Lexical node so the bishop can edit either piece
 *  without touching the page frame. */
export class SignatureBlockNode extends DecoratorNode<React.ReactElement> {
  __closing: string;
  __signatory: string;

  static getType(): string {
    return "signature-block";
  }

  static clone(node: SignatureBlockNode): SignatureBlockNode {
    return new SignatureBlockNode(node.__closing, node.__signatory, node.__key);
  }

  constructor(closing = DEFAULT_CLOSING, signatory = DEFAULT_SIGNATORY, key?: NodeKey) {
    super(key);
    this.__closing = closing;
    this.__signatory = signatory;
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
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
    div.setAttribute("data-signature-block", "true");
    div.setAttribute("data-closing", this.__closing);
    div.setAttribute("data-signatory", this.__signatory);
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (el: HTMLElement) => {
        if (el.getAttribute("data-signature-block") !== "true") return null;
        const closing = el.getAttribute("data-closing") ?? DEFAULT_CLOSING;
        const signatory = el.getAttribute("data-signatory") ?? DEFAULT_SIGNATORY;
        return {
          conversion: () => ({ node: $createSignatureBlockNode(closing, signatory) }),
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedSignatureBlockNode {
    return {
      type: SignatureBlockNode.getType(),
      version: 1,
      closing: this.__closing,
      signatory: this.__signatory,
    };
  }

  static importJSON(json: SerializedSignatureBlockNode): SignatureBlockNode {
    return $createSignatureBlockNode(json.closing, json.signatory);
  }

  setClosing(closing: string): void {
    this.getWritable().__closing = closing;
  }
  setSignatory(signatory: string): void {
    this.getWritable().__signatory = signatory;
  }

  decorate(): React.ReactElement {
    return (
      <SignatureBlockView
        nodeKey={this.__key}
        closing={this.__closing}
        signatory={this.__signatory}
      />
    );
  }
}

export function $createSignatureBlockNode(
  closing?: string,
  signatory?: string,
): SignatureBlockNode {
  return $applyNodeReplacement(new SignatureBlockNode(closing, signatory));
}

export function $isSignatureBlockNode(
  node: LexicalNode | null | undefined,
): node is SignatureBlockNode {
  return node instanceof SignatureBlockNode;
}
