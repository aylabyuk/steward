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
 *  scales the whole sheet down to fit the host column. The bishop
 *  sees the actual layout — paper bounds, margins, two-up congregation
 *  columns — so they know what'll come out of the printer.
 *
 *  Implementation note: width-only fit (height is unconstrained) so
 *  long-but-narrow pages still scale by width and just clip vertically
 *  inside the fixed sheet — same behaviour the printer would give. */
export function ScaledProgramPreview({ variant, json, variables }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const dims = PROGRAM_CANVAS_DIMS[variant];
  const scale = useFitScale(ref, dims.w);
  return (
    <div
      ref={ref}
      className="rounded-md border border-border bg-parchment-2/40 p-3 overflow-hidden"
    >
      <div className="relative" style={{ height: dims.h * scale }}>
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
