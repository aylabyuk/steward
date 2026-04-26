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
import { interpolate } from "@/features/templates/interpolate";
import { EditPropModal } from "../EditPropModal";
import { useLetterVars } from "../letterRenderContext";
import { LETTER_VARIABLES } from "../letterVariables";

export type SerializedCalloutNode = Spread<{ label: string; body: string }, SerializedLexicalNode>;

const DEFAULT_LABEL = "Eyebrow";

/** Generic eyebrow + body callout — same brass-edged band the
 *  AssignedSundayCalloutNode renders, but with an editable label and
 *  body so the bishop can drop "Topic", "Note", "Reminder", etc.
 *  callouts anywhere in the letter. The hard-coded
 *  AssignedSundayCalloutNode stays alongside since it resolves its
 *  date dynamically from the per-speaker render context — this node
 *  is a static authoring chunk. */
export class CalloutNode extends DecoratorNode<React.ReactElement> {
  __label: string;
  __body: string;

  static getType(): string {
    return "callout";
  }

  static clone(node: CalloutNode): CalloutNode {
    return new CalloutNode(node.__label, node.__body, node.__key);
  }

  constructor(label = DEFAULT_LABEL, body = "", key?: NodeKey) {
    super(key);
    this.__label = label;
    this.__body = body;
  }

  isInline(): boolean {
    return false;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  setLabel(label: string): void {
    this.getWritable().__label = label;
  }
  setBody(body: string): void {
    this.getWritable().__body = body;
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
    div.setAttribute("data-callout", "true");
    div.setAttribute("data-label", this.__label);
    div.setAttribute("data-body", this.__body);
    return { element: div };
  }

  static importDOM(): DOMConversionMap | null {
    return {
      div: (el: HTMLElement) => {
        if (el.getAttribute("data-callout") !== "true") return null;
        return {
          conversion: () => ({
            node: $createCalloutNode(
              el.getAttribute("data-label") ?? DEFAULT_LABEL,
              el.getAttribute("data-body") ?? "",
            ),
          }),
          priority: 1,
        };
      },
    };
  }

  exportJSON(): SerializedCalloutNode {
    return {
      type: CalloutNode.getType(),
      version: 1,
      label: this.__label,
      body: this.__body,
    };
  }

  static importJSON(json: SerializedCalloutNode): CalloutNode {
    return $createCalloutNode(json.label ?? DEFAULT_LABEL, json.body ?? "");
  }

  decorate(): React.ReactElement {
    return <CalloutView nodeKey={this.__key} label={this.__label} body={this.__body} />;
  }
}

function CalloutView({ nodeKey, label, body }: { nodeKey: NodeKey; label: string; body: string }) {
  const [editor] = useLexicalComposerContext();
  const vars = useLetterVars();
  const [editing, setEditing] = useState<"label" | "body" | null>(null);

  function save(next: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (!(node instanceof CalloutNode)) return;
      if (editing === "label") node.setLabel(next.trim() || DEFAULT_LABEL);
      else if (editing === "body") node.setBody(next);
    });
    setEditing(null);
  }

  return (
    <>
      <div
        contentEditable={false}
        className="select-none my-5 px-6 py-4 bg-linear-to-b from-brass-soft/15 to-brass-soft/5 border-l-2 border-brass rounded-r-md"
      >
        <button
          type="button"
          onClick={() => setEditing("label")}
          className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-deep mb-2 hover:underline focus:outline-none"
        >
          {interpolate(label, vars)}
        </button>
        <button
          type="button"
          onClick={() => setEditing("body")}
          className="block font-display text-[22px] italic text-walnut text-left w-full hover:underline focus:outline-none"
        >
          {body ? interpolate(body, vars) : "Click to set body"}
        </button>
      </div>
      <EditPropModal
        open={editing !== null}
        title={editing === "body" ? "Edit callout body" : "Edit eyebrow label"}
        initial={editing === "body" ? body : label}
        variables={LETTER_VARIABLES}
        multiline={editing === "body"}
        onSave={save}
        onCancel={() => setEditing(null)}
      />
    </>
  );
}

export function $createCalloutNode(label?: string, body?: string): CalloutNode {
  return $applyNodeReplacement(new CalloutNode(label, body));
}

export function $isCalloutNode(node: LexicalNode | null | undefined): node is CalloutNode {
  return node instanceof CalloutNode;
}
