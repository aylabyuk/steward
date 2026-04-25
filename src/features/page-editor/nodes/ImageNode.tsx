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

export type SerializedImageNode = Spread<
  { src: string; alt: string; widthPct: number; caption?: string },
  SerializedLexicalNode
>;

interface ImageOpts {
  src: string;
  alt: string;
  widthPct?: number;
  caption?: string;
}

/** Inline-image block. Renders an `<img>` with an optional caption,
 *  centered on the page at a percentage of the canvas width. Phase 1
 *  ships data-URL + remote-URL sources only — Firebase Storage upload
 *  glue lands in Phase 5 polish. */
export class ImageNode extends DecoratorNode<React.ReactElement> {
  __src: string;
  __alt: string;
  __widthPct: number;
  __caption: string | undefined;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(
      { src: node.__src, alt: node.__alt, widthPct: node.__widthPct, caption: node.__caption },
      node.__key,
    );
  }

  constructor(opts: ImageOpts, key?: NodeKey) {
    super(key);
    this.__src = opts.src;
    this.__alt = opts.alt;
    this.__widthPct = opts.widthPct ?? 60;
    this.__caption = opts.caption;
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
    const fig = document.createElement("figure");
    fig.setAttribute("data-image-node", "true");
    const img = document.createElement("img");
    img.src = this.__src;
    img.alt = this.__alt;
    img.style.width = `${this.__widthPct}%`;
    fig.appendChild(img);
    if (this.__caption) {
      const cap = document.createElement("figcaption");
      cap.textContent = this.__caption;
      fig.appendChild(cap);
    }
    return { element: fig };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      img: (el: HTMLElement) => {
        const img = el as HTMLImageElement;
        return {
          conversion: () => ({
            node: $createImageNode({ src: img.src, alt: img.alt || "" }),
          }),
          priority: 0,
        };
      },
    };
  }

  exportJSON(): SerializedImageNode {
    return {
      type: ImageNode.getType(),
      version: 1,
      src: this.__src,
      alt: this.__alt,
      widthPct: this.__widthPct,
      caption: this.__caption,
    };
  }

  static importJSON(json: SerializedImageNode): ImageNode {
    return $createImageNode({
      src: json.src,
      alt: json.alt,
      widthPct: json.widthPct,
      caption: json.caption,
    });
  }

  decorate(): React.ReactElement {
    return (
      <figure
        contentEditable={false}
        className="select-none my-4 mx-auto flex flex-col items-center"
        style={{ width: `${this.__widthPct}%` }}
      >
        <img src={this.__src} alt={this.__alt} className="max-w-full block" />
        {this.__caption && (
          <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
            {this.__caption}
          </figcaption>
        )}
      </figure>
    );
  }
}

export function $createImageNode(opts: ImageOpts): ImageNode {
  return $applyNodeReplacement(new ImageNode(opts));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
