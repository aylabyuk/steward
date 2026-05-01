import { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { LinkNode } from "@lexical/link";
import { ListItemNode, ListNode } from "@lexical/list";
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from "@lexical/markdown";
import { lexicalTheme } from "@/features/program-templates/utils/lexicalTheme";
import { ProgramToolbar } from "@/features/program-templates/ProgramToolbar";
import type { ProgramVariable } from "@/features/program-templates/utils/programVariables";
import { VariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";
import { VARIABLE_CHIP_MARKDOWN_TRANSFORMER } from "@/features/program-templates/nodes/utils/variableChipMarkdown";

interface Props {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  ariaLabel: string;
  /** Optional Insert-variable surface. Omit both to hide the menu —
   *  every editor still round-trips `{{token}}` text into chips for
   *  authoring even when no menu is shown. */
  variables?: readonly ProgramVariable[];
  groupLabels?: Readonly<Record<string, string>>;
  /** Placeholder copy when the editor is empty. */
  placeholder?: string;
}

const NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, LinkNode, VariableChipNode];
const ALL_TRANSFORMERS: Transformer[] = [VARIABLE_CHIP_MARKDOWN_TRANSFORMER, ...TRANSFORMERS];

/** Canonical markdown editor for the app — Lexical inside, plain
 *  markdown on the wire. `{{token}}` text round-trips through inline
 *  visual chips so the existing markdown-based render pipeline keeps
 *  working while the bishop sees a structured editor. Drop-in for
 *  every place we previously used MDXEditor.
 *
 *  Layout: rounded chalk wrapper + sticky walnut toolbar + scrollable
 *  content. Wrapper claims its parent's height when the parent is
 *  height-constrained (`lg:h-full lg:min-h-0` chain); otherwise the
 *  scroll container's `min-h-70` keeps the editor a usable 280 px
 *  in natural-flow contexts (modals, settings sections). */
export function MarkdownEditor({
  initialMarkdown,
  onChange,
  ariaLabel,
  variables,
  groupLabels,
  placeholder = "Write here…",
}: Props) {
  const initialConfig = {
    namespace: "MarkdownEditor",
    theme: lexicalTheme,
    nodes: NODES,
    onError: (e: Error) => {
      console.error("[MarkdownEditor]", e);
      throw e;
    },
    editorState: () => $convertFromMarkdownString(initialMarkdown, ALL_TRANSFORMERS),
  };

  return (
    <div className="rounded-lg border border-border bg-chalk overflow-hidden flex flex-col lg:h-full lg:min-h-0">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="sticky top-0 z-10 bg-parchment-2 shadow-[0_1px_0_var(--color-border)]">
          <ProgramToolbar variables={variables} groupLabels={groupLabels} />
        </div>
        <div className="relative flex-1 min-h-70 overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={ariaLabel}
                className="prose prose-sm max-w-none min-h-70 px-4 py-3 font-serif text-walnut text-[15px] leading-relaxed focus:outline-none"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute top-3 left-4 font-serif italic text-[14px] text-walnut-3">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <LinkPlugin />
        <MarkdownOnChange onChange={onChange} />
      </LexicalComposer>
    </div>
  );
}

interface SectionProps extends Omit<Props, "ariaLabel"> {
  label: string;
  /** Optional override for the editor's aria-label. Defaults to `label`. */
  ariaLabel?: string;
  disabled?: boolean;
}

/** Labelled wrapper around `MarkdownEditor` matching the previous
 *  `EditorSection` API consumed by the message template cards,
 *  template editor modal, and per-speaker letter override panel. */
export function EditorSection({ label, disabled, ...rest }: SectionProps) {
  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 mb-1.5">
        {label}
      </div>
      <MarkdownEditor {...rest} ariaLabel={rest.ariaLabel || label} />
    </div>
  );
}

function MarkdownOnChange({ onChange }: { onChange: (md: string) => void }): null {
  const [editor] = useLexicalComposerContext();
  const onChangeRef = useRef(onChange);
  const skipFirst = useRef(true);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (skipFirst.current) {
        skipFirst.current = false;
        return;
      }
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      editorState.read(() => {
        onChangeRef.current($convertToMarkdownString(ALL_TRANSFORMERS));
      });
    });
  }, [editor]);
  return null;
}
