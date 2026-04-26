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
import { EditPropModal } from "../EditPropModal";

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
 *  glue lands in Phase 5 polish. Click any field (image / alt /
 *  width / caption) to edit through the in-app modal. */
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

  setSrc(src: string): void {
    this.getWritable().__src = src;
  }
  setAlt(alt: string): void {
    this.getWritable().__alt = alt;
  }
  setWidthPct(pct: number): void {
    this.getWritable().__widthPct = pct;
  }
  setCaption(caption: string): void {
    this.getWritable().__caption = caption || undefined;
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
      <ImageView
        nodeKey={this.__key}
        src={this.__src}
        alt={this.__alt}
        widthPct={this.__widthPct}
        caption={this.__caption ?? ""}
      />
    );
  }
}

type ImageField = "src" | "alt" | "width" | "caption";

function ImageView({
  nodeKey,
  src,
  alt,
  widthPct,
  caption,
}: {
  nodeKey: NodeKey;
  src: string;
  alt: string;
  widthPct: number;
  caption: string;
}) {
  const [editor] = useLexicalComposerContext();
  const [editing, setEditing] = useState<ImageField | null>(null);

  function save(next: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!(node instanceof ImageNode)) return;
      if (editing === "src") node.setSrc(next.trim());
      else if (editing === "alt") node.setAlt(next.trim());
      else if (editing === "caption") node.setCaption(next);
      else if (editing === "width") {
        const n = Number.parseFloat(next);
        if (Number.isFinite(n) && n >= 10 && n <= 100) node.setWidthPct(n);
      }
    });
    setEditing(null);
  }

  const labels: Record<ImageField, string> = {
    src: "Image URL",
    alt: "Alt text",
    width: "Width (10 – 100%)",
    caption: "Caption",
  };
  const initials: Record<ImageField, string> = {
    src,
    alt,
    width: String(widthPct),
    caption,
  };

  return (
    <>
      <figure
        contentEditable={false}
        className="select-none my-4 mx-auto flex flex-col items-center group relative"
        style={{ width: `${widthPct}%` }}
      >
        {src ? (
          <img src={src} alt={alt} className="max-w-full block" />
        ) : (
          <button
            type="button"
            onClick={() => setEditing("src")}
            className="w-full aspect-3/2 flex items-center justify-center border border-dashed border-walnut-3/60 rounded bg-parchment-2 text-walnut-3 font-mono text-[11px] tracking-[0.14em] uppercase hover:bg-parchment-3"
          >
            + Click to set image URL
          </button>
        )}
        {caption && (
          <button
            type="button"
            onClick={() => setEditing("caption")}
            className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 hover:underline focus:outline-none"
          >
            {caption}
          </button>
        )}
        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-chalk border border-border-strong rounded shadow-elev-2 p-0.5">
          <ImgEditChip label="URL" onClick={() => setEditing("src")} />
          <ImgEditChip label="Alt" onClick={() => setEditing("alt")} />
          <ImgEditChip label={`${widthPct}%`} onClick={() => setEditing("width")} />
          {!caption && <ImgEditChip label="+ caption" onClick={() => setEditing("caption")} />}
        </div>
      </figure>
      <EditPropModal
        open={editing !== null}
        title={editing ? labels[editing] : ""}
        initial={editing ? initials[editing] : ""}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    </>
  );
}

function ImgEditChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="font-mono text-[9.5px] tracking-[0.06em] px-1.5 py-0.5 rounded text-walnut-2 hover:bg-parchment-2"
    >
      {label}
    </button>
  );
}

export function $createImageNode(opts: ImageOpts): ImageNode {
  return $applyNodeReplacement(new ImageNode(opts));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
