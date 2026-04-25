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
  /** Fires once after hydration with the initial editor state. The
   *  host should use this to seed *both* the working state and the
   *  saved baseline so dirty-tracking starts clean — without it the
   *  bishop's pageStyle-only edits couldn't be saved (the editor's
   *  current content was never available to the writer). */
  onInitial?: (stateJson: string) => void;
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
  onInitial,
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
      <StateJsonOnChangePlugin onChange={onChange} onInitial={onInitial} />
    </LexicalComposer>
  );
}

interface StatePluginProps {
  onChange: (json: string) => void;
  onInitial?: (json: string) => void;
}

/** Surfaces the editor state as Lexical JSON. Lexical commits the
 *  initial hydration synchronously during render (inside the
 *  composer's `useMemo`), which is *before* this effect can register
 *  an update listener — so the hydration tick never reaches the
 *  listener. We capture the post-hydration state synchronously when
 *  the effect runs, then let the listener emit only dirty updates.
 *  Without this, the bishop's first keystroke gets mis-classified as
 *  "initial" and silently re-baselined, which surfaced as "save
 *  doesn't persist" because the bishop's intent never registered as
 *  a dirty edit. */
function StateJsonOnChangePlugin({ onChange, onInitial }: StatePluginProps): null {
  const [editor] = useLexicalComposerContext();
  const onChangeRef = useRef(onChange);
  const onInitialRef = useRef(onInitial);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);
  useEffect(() => {
    onInitialRef.current = onInitial;
  }, [onInitial]);

  useEffect(() => {
    const initialJson = JSON.stringify(editor.getEditorState().toJSON());
    onInitialRef.current?.(initialJson);
    return editor.registerUpdateListener(({ editorState, dirtyElements, dirtyLeaves }) => {
      if (dirtyElements.size === 0 && dirtyLeaves.size === 0) return;
      onChangeRef.current(JSON.stringify(editorState.toJSON()));
    });
  }, [editor]);
  return null;
}
