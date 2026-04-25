import { useEffect, useRef } from "react";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { HorizontalRulePlugin } from "@lexical/react/LexicalHorizontalRulePlugin";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import type { Klass, LexicalEditor, LexicalNode } from "lexical";
import { FloatingSelectionToolbar } from "@/features/program-templates/FloatingSelectionToolbar";
import { lexicalTheme } from "@/features/program-templates/lexicalTheme";
import { PageEditorAutoLink } from "./plugins/PageEditorAutoLink";
import { PageEditorMarkdownShortcuts } from "./plugins/PageEditorMarkdownShortcuts";

interface Props {
  /** Stable namespace — drives editor identity for collaborative state
   *  + DOM debugging. */
  namespace: string;
  /** Node classes the editor knows about. Host editors compose
   *  `PAGE_EDITOR_BASE_NODES` with their own domain nodes. */
  nodes: ReadonlyArray<Klass<LexicalNode>>;
  /** Initial editor state — either a JSON string (Lexical state) or
   *  an `(editor) => void` callback that builds the seed state. */
  initialState: string | null | ((editor: LexicalEditor) => void);
  /** Fires on every user edit with the editor state serialised as
   *  Lexical JSON. The host owns dirty-tracking + persistence. */
  onChange: (stateJson: string) => void;
  /** Aria-label for the contenteditable surface. */
  ariaLabel: string;
  /** Optional content slot for the page-level toolbar (block-type +
   *  lists + Insert Variable + page-style trigger). Omit when the
   *  editor surfaces formatting only via the floating selection
   *  toolbar. */
  pageToolbar?: React.ReactNode;
  /** The chrome-wrapped page surface — typically `<PageCanvas>` with
   *  `<LetterChrome>` already inside. The composer renders the
   *  contenteditable as its child. */
  page: (contentEditable: React.ReactNode) => React.ReactNode;
}

/** Wraps `LexicalComposer` with the union of plugins every WYSIWYG
 *  page editor needs (rich-text, history, lists, link, horizontal
 *  rule, floating selection toolbar). Host editors layer their own
 *  domain plugins (slash commands, paginator) on top by passing them
 *  as `pageToolbar` siblings or by mounting them inside the `page`
 *  render slot. */
export function PageEditorComposer({
  namespace,
  nodes,
  initialState,
  onChange,
  ariaLabel,
  pageToolbar,
  page,
}: Props) {
  const initialConfig = {
    namespace,
    theme: lexicalTheme,
    nodes: [...nodes],
    onError: (e: Error) => {
      console.error(`[PageEditorComposer:${namespace}]`, e);
      throw e;
    },
    editorState: initialState,
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      {pageToolbar}
      {page(
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              aria-label={ariaLabel}
              className="prose prose-sm max-w-none font-serif text-walnut text-[16.5px] leading-[1.65] focus:outline-none [&_em]:text-bordeaux [&_strong]:text-walnut"
            />
          }
          placeholder={null}
          ErrorBoundary={LexicalErrorBoundary}
        />,
      )}
      <HistoryPlugin />
      <ListPlugin />
      <LinkPlugin />
      <HorizontalRulePlugin />
      <PageEditorAutoLink />
      <PageEditorMarkdownShortcuts />
      <FloatingSelectionToolbar />
      <StateJsonOnChangePlugin onChange={onChange} />
    </LexicalComposer>
  );
}

/** Surfaces the editor state as Lexical JSON. Skips the initial
 *  hydration so the parent doesn't get its own `initialState` echoed
 *  back. Pulled out of the composer so the file stays under the
 *  150-LOC cap. */
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
