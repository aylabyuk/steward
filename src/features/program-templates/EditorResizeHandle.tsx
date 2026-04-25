import { useRef } from "react";

interface Props {
  onDragStart: () => void;
  onDrag: (deltaPx: number) => void;
}

/** Vertical splitter between the editor and the preview on desktop.
 *  Uses pointer capture so drags don't get lost if the cursor leaves
 *  the 12 px hit-target. Hidden below `lg:` since the mobile layout
 *  is single-column. */
export function EditorResizeHandle({ onDragStart, onDrag }: Props) {
  const startX = useRef<number | null>(null);
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize editor"
      tabIndex={-1}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        startX.current = e.clientX;
        onDragStart();
      }}
      onPointerMove={(e) => {
        if (startX.current === null) return;
        onDrag(e.clientX - startX.current);
      }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        e.currentTarget.releasePointerCapture(e.pointerId);
        startX.current = null;
      }}
      onPointerCancel={() => {
        startX.current = null;
      }}
      className="hidden lg:flex lg:order-2 shrink-0 w-4 mx-2 cursor-col-resize items-center justify-center group select-none touch-none"
    >
      <span
        aria-hidden
        className="block w-1 h-12 bg-walnut-3/60 group-hover:bg-walnut-2 group-active:bg-walnut transition-colors rounded-full"
      />
    </div>
  );
}
