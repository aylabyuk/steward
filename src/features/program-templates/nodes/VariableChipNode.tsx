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
  type TextFormatType,
} from "lexical";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useLetterVars, useLiveValues } from "@/features/page-editor/letterRenderContext";
import { useVariableMeta, useVariableRegistry } from "@/features/page-editor/variableRegistry";

export type SerializedVariableChipNode = Spread<
  { token: string; format?: number; style?: string },
  SerializedLexicalNode
>;

// Lexical's text-format bitmask constants — kept inline so the chip
// can mirror what FORMAT_TEXT_COMMAND would do to a TextNode.
const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_STRIKE = 4;
const FORMAT_UNDERLINE = 8;
const FORMAT_CODE = 16;
const FORMAT_SUBSCRIPT = 32;
const FORMAT_SUPERSCRIPT = 64;

export function variableChipFormatBit(type: TextFormatType): number {
  switch (type) {
    case "bold":
      return FORMAT_BOLD;
    case "italic":
      return FORMAT_ITALIC;
    case "strikethrough":
      return FORMAT_STRIKE;
    case "underline":
      return FORMAT_UNDERLINE;
    case "code":
      return FORMAT_CODE;
    case "subscript":
      return FORMAT_SUBSCRIPT;
    case "superscript":
      return FORMAT_SUPERSCRIPT;
    default:
      return 0;
  }
}

/** Inline decorator node: a "chip" representing a `{{token}}`
 *  reference in the editor. Renders as the resolved sample value
 *  (e.g. `Brother Park` instead of `{{speakerName}}`) so the bishop
 *  sees what the letter would actually look like. Visually
 *  indistinguishable from authored text by default; a soft brass
 *  hover treatment surfaces the "this is dynamic" hint and clicking
 *  opens a picker to swap the variable.
 *
 *  Carries a Lexical-style format bitmask so toolbar formatting
 *  (bold / italic / underline / etc) round-trips through the chip
 *  via the companion VariableChipFormatPlugin. */
export class VariableChipNode extends DecoratorNode<React.ReactElement> {
  __token: string;
  __format: number;
  __style: string;

  static getType(): string {
    return "variable-chip";
  }

  static clone(node: VariableChipNode): VariableChipNode {
    return new VariableChipNode(node.__token, node.__format, node.__style, node.__key);
  }

  constructor(token: string, format = 0, style = "", key?: NodeKey) {
    super(key);
    this.__token = token;
    this.__format = format;
    this.__style = style;
  }

  getToken(): string {
    return this.__token;
  }
  setToken(token: string): void {
    this.getWritable().__token = token;
  }

  getFormat(): number {
    return this.getLatest().__format;
  }
  setFormat(format: number): void {
    this.getWritable().__format = format;
  }
  hasFormat(type: TextFormatType): boolean {
    const bit = variableChipFormatBit(type);
    return bit !== 0 && (this.getFormat() & bit) !== 0;
  }
  toggleFormat(type: TextFormatType): void {
    const bit = variableChipFormatBit(type);
    if (bit === 0) return;
    this.setFormat(this.getFormat() ^ bit);
  }

  getStyle(): string {
    return this.getLatest().__style;
  }
  setStyle(style: string): void {
    this.getWritable().__style = style;
  }
  /** Read a single CSS property value out of `__style`. Returns ""
   *  when the property isn't set so callers can use a falsy check. */
  getCSSProperty(property: string): string {
    return parseStyleString(this.getStyle())[property] ?? "";
  }
  /** Mirror of `$patchStyleText`'s per-property update for a single
   *  chip. Pass `null` as the value to remove the property. */
  patchStyle(patch: Record<string, string | null>): void {
    const next = { ...parseStyleString(this.getStyle()) };
    for (const [k, v] of Object.entries(patch)) {
      if (v === null) delete next[k];
      else next[k] = v;
    }
    this.setStyle(stringifyStyle(next));
  }

  isInline(): boolean {
    return true;
  }
  isKeyboardSelectable(): boolean {
    return true;
  }

  createDOM(_config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    span.style.display = "inline";
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
      version: 3,
      token: this.__token,
      format: this.__format,
      style: this.__style,
    };
  }

  static importJSON(json: SerializedVariableChipNode): VariableChipNode {
    return $createVariableChipNode(json.token, json.format ?? 0, json.style ?? "");
  }

  decorate(): React.ReactElement {
    return (
      <ChipView
        nodeKey={this.__key}
        token={this.__token}
        format={this.__format}
        style={this.__style}
      />
    );
  }
}

function parseStyleString(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const decl of s.split(";")) {
    const idx = decl.indexOf(":");
    if (idx < 0) continue;
    const k = decl.slice(0, idx).trim();
    const v = decl.slice(idx + 1).trim();
    if (k && v) out[k] = v;
  }
  return out;
}

function stringifyStyle(obj: Record<string, string>): string {
  return Object.entries(obj)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

function styleStringToReact(s: string): React.CSSProperties {
  const obj = parseStyleString(s);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    const camel = k.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    out[camel] = v;
  }
  return out as React.CSSProperties;
}

interface ChipViewProps {
  nodeKey: NodeKey;
  token: string;
  format: number;
  style: string;
}

function ChipView({ nodeKey, token, format, style }: ChipViewProps) {
  const [editor] = useLexicalComposerContext();
  const meta = useVariableMeta(token);
  const { variables, groupLabels } = useVariableRegistry();
  const liveVars = useLetterVars();
  const isLive = useLiveValues();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  // Resolution order: the live vars bag set by `LetterRenderContextProvider`
  // (so per-speaker editors render real values), then the static sample
  // from the variable registry, then the variable's human label, then
  // the raw token.
  const display = liveVars[token] ?? meta?.sample ?? meta?.label ?? token;

  // Click-outside dismiss. Without this, opening a second chip leaves
  // the first one's picker mounted and you end up with overlapping
  // menus competing for clicks. Mousedown beats click ordering so a
  // click that lands inside another chip's wrapper closes this one
  // before that one opens.
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

  // Wrap the display value in <strong>/<em>/<u>/<s>/<code> per the
  // chip's stored format bits, the same layered strategy renderText
  // uses on the speaker landing page so the print + email paths
  // see the formatting too.
  let formatted: React.ReactNode = display;
  if (format & FORMAT_CODE)
    formatted = (
      <code className="font-mono text-[0.92em] bg-parchment-2 px-1 rounded">{formatted}</code>
    );
  if (format & FORMAT_BOLD) formatted = <strong>{formatted}</strong>;
  if (format & FORMAT_ITALIC) formatted = <em>{formatted}</em>;
  if (format & FORMAT_UNDERLINE) formatted = <u>{formatted}</u>;
  if (format & FORMAT_STRIKE) formatted = <s>{formatted}</s>;

  return (
    <span
      ref={wrapRef}
      className="group/chip"
      style={{ position: "relative", display: "inline-block" }}
    >
      <button
        type="button"
        contentEditable={false}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onMouseDown={(e) => e.preventDefault()}
        // Inline style applies the chip's color / background-color /
        // font-family / font-size patches the toolbar wrote via
        // $patchStyleWithChips, mirroring exactly what TextNode would
        // surface from its own __style. Tailwind classes set defaults
        // (font-serif, text-inherit) — inline style overrides them
        // when the user picks something else.
        style={styleStringToReact(style)}
        className="inline align-baseline px-0 py-0 m-0 bg-transparent border-0 font-serif text-inherit cursor-pointer focus:outline-none rounded-sm hover:bg-brass-soft/25 hover:[box-shadow:0_0_0_2px_color-mix(in_srgb,var(--color-brass-soft)_30%,transparent)]"
      >
        {formatted}
      </button>
      {/* Floating "Preview · token" tooltip — appears on hover so the
          bishop catches the it's-a-placeholder cue at the exact moment
          they're wondering about a value. Hidden while the picker
          popover is open so the two don't visually fight. */}
      {!open && (
        <span
          aria-hidden
          contentEditable={false}
          className="pointer-events-none absolute left-1/2 -translate-x-1/2 -top-7 z-40 whitespace-nowrap rounded-md bg-walnut text-parchment px-2 py-0.5 font-mono text-[10px] tracking-[0.08em] opacity-0 group-hover/chip:opacity-100 transition-opacity duration-100"
        >
          {isLive ? (
            <span className="text-brass-soft">{`{{${token}}}`}</span>
          ) : (
            <>
              Preview · <span className="text-brass-soft">{`{{${token}}}`}</span>
            </>
          )}
        </span>
      )}
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

export function $createVariableChipNode(token: string, format = 0, style = ""): VariableChipNode {
  return $applyNodeReplacement(new VariableChipNode(token, format, style));
}

export function $isVariableChipNode(
  node: LexicalNode | null | undefined,
): node is VariableChipNode {
  return node instanceof VariableChipNode;
}
