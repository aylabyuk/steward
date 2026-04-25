import { useRef } from "react";
import type { ProgramTemplateKey } from "@/lib/types";
import { useFitScale } from "@/hooks/useFitScale";
import { PROGRAM_CANVAS_DIMS, ProgramCanvas } from "./ProgramCanvas";
import { renderProgramState } from "./programTemplateRender";

interface Props {
  variant: ProgramTemplateKey;
  /** Lexical EditorState JSON. */
  json: string;
  /** Variable map used to resolve `{{token}}` chips at preview time. */
  variables: Record<string, string>;
}

/** Renders the program at true 8.5 × 11 print proportions, then
 *  fits the whole sheet inside the host column on both axes — width
 *  AND height — so the bishop sees the printed layout in one glance
 *  without scrolling. The container is `flex: 1` so a parent that
 *  uses `lg:h-full` will give the preview the maximum vertical room
 *  the viewport allows. */
export function ScaledProgramPreview({ variant, json, variables }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dims = PROGRAM_CANVAS_DIMS[variant];
  const scale = useFitScale(ref, dims.w, dims.h);
  return (
    <div
      ref={ref}
      className="rounded-md border border-border bg-parchment-2/40 p-3 overflow-hidden flex-1 min-h-0 grid place-items-center"
    >
      <div
        style={{
          width: dims.w * scale,
          height: dims.h * scale,
          position: "relative",
        }}
      >
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            width: dims.w,
            height: dims.h,
          }}
        >
          <ProgramCanvas variant={variant}>{renderProgramState(json, variables)}</ProgramCanvas>
        </div>
      </div>
    </div>
  );
}
