import { useEffect, useRef, useState } from "react";
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
import { useVariableMeta, useVariableRegistry } from "@/features/page-editor/variableRegistry";

export type SerializedVariableChipNode = Spread<{ token: string }, SerializedLexicalNode>;

/** Inline decorator node: a "chip" representing a `{{token}}`
 *  reference in the editor. Renders inline as the resolved sample
 *  value (e.g. `Brother Park` instead of `{{speakerName}}`) so the
 *  bishop sees what the letter would actually look like. Click to
 *  swap which variable the chip points to via a small popover. */
export class VariableChipNode extends DecoratorNode<React.ReactElement> {
  __token: string;

  static getType(): string {
    return "variable-chip";
  }

  static clone(node: VariableChipNode): VariableChipNode {
    return new VariableChipNode(node.__token, node.__key);
  }

  constructor(token: string, key?: NodeKey) {
    super(key);
    this.__token = token;
  }

  getToken(): string {
    return this.__token;
  }

  setToken(token: string): void {
    this.getWritable().__token = token;
  }

  isInline(): boolean {
    return true;
  }

  isKeyboardSelectable(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline-block";
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
      version: 1,
      token: this.__token,
    };
  }

  static importJSON(json: SerializedVariableChipNode): VariableChipNode {
    return $createVariableChipNode(json.token);
  }

  decorate(): React.ReactElement {
    return <ChipView nodeKey={this.__key} token={this.__token} />;
  }
}

function ChipView({ nodeKey, token }: { nodeKey: NodeKey; token: string }) {
  const [editor] = useLexicalComposerContext();
  const meta = useVariableMeta(token);
  const { variables, groupLabels } = useVariableRegistry();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const display = meta?.sample ?? meta?.label ?? token;

  // Click-outside / focus-out → dismiss. Without this, opening a
  // second chip leaves the first one's picker mounted and you end
  // up with overlapping menus competing for clicks. Mousedown beats
  // click ordering so a click that lands inside another chip's
  // wrapper closes this one before that one opens.
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function changeTo(nextToken: string) {
    editor.update(() => {
      const node = $getNodeByKey(nodeKey);
      if (node instanceof VariableChipNode) node.setToken(nextToken);
    });
    setOpen(false);
  }

  // Group rows in the picker the same way the toolbar Variables
  // dropdown does — adjacent same-group rows form a section.
  const groups: Array<[string, (typeof variables)[number][]]> = [];
  for (const v of variables) {
    const last = groups.at(-1);
    const g = v.group ?? "";
    if (last && last[0] === g) last[1].push(v);
    else groups.push([g, [v]]);
  }

  return (
    <span ref={wrapRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        contentEditable={false}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseDown={(e) => e.preventDefault()}
        title={
          meta
            ? `${meta.label} — click to change variable`
            : `${token} — unknown variable, click to pick`
        }
        className="inline-flex items-center align-baseline rounded-sm bg-brass-soft/25 px-1 font-serif text-walnut underline decoration-dotted decoration-brass-deep/60 underline-offset-2 hover:bg-brass-soft/40 focus:outline-none cursor-pointer"
      >
        {display}
      </button>
      {open && (
        <span
          contentEditable={false}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 50,
            display: "block",
            minWidth: 240,
            maxHeight: 320,
            overflowY: "auto",
            background: "var(--color-chalk)",
            border: "1px solid var(--color-border-strong)",
            borderRadius: 8,
            boxShadow: "0 12px 32px rgba(35, 24, 21, 0.18)",
            padding: 4,
            fontFamily: "var(--font-sans)",
            userSelect: "none",
          }}
          onMouseDown={(e) => e.preventDefault()}
        >
          {groups.map(([group, items], i) => (
            <span key={group || `g${i}`} style={{ display: "block" }}>
              {i > 0 && (
                <span
                  style={{
                    display: "block",
                    height: 1,
                    background: "var(--color-border)",
                    margin: "4px 0",
                  }}
                />
              )}
              {group && (
                <span
                  style={{
                    display: "block",
                    fontFamily: "var(--font-mono)",
                    fontSize: 9.5,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "var(--color-brass-deep)",
                    padding: "8px 10px 4px",
                  }}
                >
                  {groupLabels[group] ?? group}
                </span>
              )}
              {items.map((v) => {
                const active = v.token === token;
                return (
                  <button
                    key={v.token}
                    type="button"
                    onClick={() => changeTo(v.token)}
                    onMouseDown={(e) => e.preventDefault()}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 8,
                      width: "100%",
                      padding: "6px 10px",
                      borderRadius: 4,
                      border: 0,
                      background: active
                        ? "color-mix(in srgb, var(--color-bordeaux) 12%, transparent)"
                        : "transparent",
                      color: "var(--color-walnut)",
                      cursor: "pointer",
                      textAlign: "left",
                      font: "inherit",
                    }}
                  >
                    <span
                      style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
                    >
                      <span style={{ fontSize: 13 }}>{v.label}</span>
                      {v.sample && (
                        <span
                          style={{
                            fontFamily: "var(--font-serif)",
                            fontStyle: "italic",
                            fontSize: 11.5,
                            color: "var(--color-walnut-3)",
                          }}
                        >
                          {v.sample}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </span>
          ))}
        </span>
      )}
    </span>
  );
}

export function $createVariableChipNode(token: string): VariableChipNode {
  return $applyNodeReplacement(new VariableChipNode(token));
}

export function $isVariableChipNode(
  node: LexicalNode | null | undefined,
): node is VariableChipNode {
  return node instanceof VariableChipNode;
}
