import {
  $applyNodeReplacement,
  DecoratorNode,
  type DOMConversionMap,
  type DOMExportOutput,
  type EditorConfig,
  type LexicalNode,
  type SerializedLexicalNode,
} from "lexical";
import { useAssignedDate } from "../utils/letterRenderContext";

export type SerializedAssignedSundayCalloutNode = SerializedLexicalNode;

/** Block-level decorator: the gradient bordeaux+brass callout that
 *  marks the speaker's assigned Sunday in the letter body. Lifted out
 *  of `LetterCanvas`'s fragile `splitParagraphs` heuristic — now an
 *  explicit Lexical node the bishop can drag, delete, or duplicate.
 *
 *  The visible date is supplied via `LetterRenderContextProvider` so
 *  the same template renders with a different date for every speaker
 *  without mutating the editor state. */
export class AssignedSundayCalloutNode extends DecoratorNode<React.ReactElement> {
  static getType(): string {
    return "assigned-sunday-callout";
  }

  static clone(node: AssignedSundayCalloutNode): AssignedSundayCalloutNode {
    return new AssignedSundayCalloutNode(node.__key);
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
    div.setAttribute("data-assigned-sunday-callout", "true");
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (el: HTMLElement) => {
        if (el.getAttribute("data-assigned-sunday-callout") !== "true") return null;
        return {
          conversion: () => ({ node: $createAssignedSundayCalloutNode() }),
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedAssignedSundayCalloutNode {
    return { type: AssignedSundayCalloutNode.getType(), version: 1 };
  }

  static importJSON(_json: SerializedAssignedSundayCalloutNode): AssignedSundayCalloutNode {
    return $createAssignedSundayCalloutNode();
  }

  decorate(): React.ReactElement {
    return <AssignedSundayCalloutView />;
  }
}

function AssignedSundayCalloutView() {
  const date = useAssignedDate();
  return (
    <div
      contentEditable={false}
      className="select-none my-5 px-6 py-4 bg-linear-to-b from-brass-soft/15 to-brass-soft/5 border-l-2 border-brass rounded-r-md"
    >
      <div className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-deep mb-2">
        Assigned Sunday
      </div>
      <div className="font-display text-[22px] italic text-walnut">
        {date ?? "Assigned Sunday — set per speaker"}
      </div>
    </div>
  );
}

export function $createAssignedSundayCalloutNode(): AssignedSundayCalloutNode {
  return $applyNodeReplacement(new AssignedSundayCalloutNode());
}

export function $isAssignedSundayCalloutNode(
  node: LexicalNode | null | undefined,
): node is AssignedSundayCalloutNode {
  return node instanceof AssignedSundayCalloutNode;
}
