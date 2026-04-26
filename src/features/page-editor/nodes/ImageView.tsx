import { useState } from "react";
import { $getNodeByKey, type NodeKey } from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { EditPropModal } from "../EditPropModal";
import { ImageNode } from "./ImageNode";

type ImageField = "src" | "alt" | "width" | "caption";

interface Props {
  nodeKey: NodeKey;
  src: string;
  alt: string;
  widthPct: number;
  caption: string;
}

const LABELS: Record<ImageField, string> = {
  src: "Image URL",
  alt: "Alt text",
  width: "Width (10 – 100%)",
  caption: "Caption",
};

/** Click-to-edit image decorator. Lifted out of the node module so
 *  the class file stays under the per-file LOC cap. */
export function ImageView({ nodeKey, src, alt, widthPct, caption }: Props) {
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
        title={editing ? LABELS[editing] : ""}
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
