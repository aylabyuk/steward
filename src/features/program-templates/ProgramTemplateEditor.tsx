import { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { HeadingNode, QuoteNode } from "@lexical/rich-text";
import { ListItemNode, ListNode } from "@lexical/list";
import { lexicalTheme } from "./lexicalTheme";
import { ProgramToolbar } from "./ProgramToolbar";
import { GROUP_LABEL, PROGRAM_VARIABLES } from "./programVariables";
import { VariableChipNode } from "./nodes/VariableChipNode";

interface Props {
  /** Lexical EditorState as a JSON string. Pass `null` for an empty
   *  editor; otherwise the JSON is hydrated on mount. */
  initialStateJson: string | null;
  /** Fires on every user edit with the editor state serialised as
   *  JSON. Storage is JSON, not markdown — this preserves the rich
   *  custom-node fidelity (variable chips, future hymn / script
   *  blocks) that markdown can't natively round-trip. */
  onChange: (stateJson: string) => void;
  ariaLabel: string;
}

const NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, VariableChipNode];

/** Headless Lexical editor pre-wired for program templates: rich-text
 *  + lists + history + variable chips. Wrap-and-go — the host page
 *  controls layout. State serialises as Lexical JSON so we keep full
 *  custom-node fidelity for the printed-program rewrite. */
export function ProgramTemplateEditor({ initialStateJson, onChange, ariaLabel }: Props) {
  const initialConfig = {
    namespace: "ProgramTemplateEditor",
    theme: lexicalTheme,
    nodes: NODES,
    onError: (e: Error) => {
      console.error("[ProgramTemplateEditor]", e);
      throw e;
    },
    editorState: initialStateJson ?? null,
  };

  return (
    <div className="rounded-lg border border-border bg-chalk overflow-hidden flex flex-col lg:h-full lg:min-h-0">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="sticky top-0 z-10 bg-parchment-2 shadow-[0_1px_0_var(--color-border)]">
          <ProgramToolbar variables={PROGRAM_VARIABLES} groupLabels={GROUP_LABEL} />
        </div>
        <div className="relative flex-1 min-h-0 overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                aria-label={ariaLabel}
                className="prose prose-sm max-w-none min-h-70 px-4 py-3 font-serif text-walnut text-[15px] leading-relaxed focus:outline-none"
              />
            }
            placeholder={
              <div className="pointer-events-none absolute top-3 left-4 font-serif italic text-[14px] text-walnut-3">
                Write the program template — text, headings, lists, variables…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <StateJsonOnChangePlugin onChange={onChange} />
      </LexicalComposer>
    </div>
  );
}

/** Surfaces the editor's contents as a Lexical-state JSON string.
 *  Suppresses the initial hydration update so we don't echo
 *  `initialStateJson` straight back to the parent. */
function StateJsonOnChangePlugin({ onChange }: { onChange: (json: string) => void }): null {
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
      onChangeRef.current(JSON.stringify(editorState.toJSON()));
    });
  }, [editor]);
  return null;
}
