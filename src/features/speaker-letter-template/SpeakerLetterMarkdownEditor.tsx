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
import {
  $convertFromMarkdownString,
  $convertToMarkdownString,
  TRANSFORMERS,
  type Transformer,
} from "@lexical/markdown";
import { lexicalTheme } from "@/features/program-templates/lexicalTheme";
import { ProgramToolbar } from "@/features/program-templates/ProgramToolbar";
import { VariableChipNode } from "@/features/program-templates/nodes/VariableChipNode";
import { VARIABLE_CHIP_MARKDOWN_TRANSFORMER } from "@/features/program-templates/nodes/variableChipMarkdown";
import { SPEAKER_LETTER_GROUP_LABEL, SPEAKER_LETTER_VARIABLES } from "./speakerLetterVariables";

interface Props {
  /** Markdown source to seed the editor with. Round-trips through
   *  `$convertFromMarkdownString` / `$convertToMarkdownString` so the
   *  rest of the speaker-letter pipeline (LetterCanvas, send-time
   *  interpolation) sees plain markdown unchanged. */
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  ariaLabel: string;
}

const NODES = [HeadingNode, QuoteNode, ListNode, ListItemNode, VariableChipNode];
const ALL_TRANSFORMERS: Transformer[] = [VARIABLE_CHIP_MARKDOWN_TRANSFORMER, ...TRANSFORMERS];

/** Lexical editor for the speaker-letter body. Markdown in / markdown
 *  out — the chip transformer converts `{{token}}` to inline visual
 *  chips for authoring while keeping the bytes on disk plain markdown
 *  so the existing letter renderer (`LetterCanvas`) keeps working
 *  with no schema change. */
export function SpeakerLetterMarkdownEditor({ initialMarkdown, onChange, ariaLabel }: Props) {
  const initialConfig = {
    namespace: "SpeakerLetterEditor",
    theme: lexicalTheme,
    nodes: NODES,
    onError: (e: Error) => {
      console.error("[SpeakerLetterMarkdownEditor]", e);
      throw e;
    },
    editorState: () => $convertFromMarkdownString(initialMarkdown, ALL_TRANSFORMERS),
  };

  return (
    <div className="rounded-lg border border-border bg-chalk overflow-hidden flex flex-col lg:h-full lg:min-h-0">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="sticky top-0 z-10 bg-parchment-2 shadow-[0_1px_0_var(--color-border)]">
          <ProgramToolbar
            variables={SPEAKER_LETTER_VARIABLES}
            groupLabels={SPEAKER_LETTER_GROUP_LABEL}
          />
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
                Write the letter — text, lists, scripture, variables…
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
        </div>
        <HistoryPlugin />
        <ListPlugin />
        <MarkdownOnChange onChange={onChange} />
      </LexicalComposer>
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
