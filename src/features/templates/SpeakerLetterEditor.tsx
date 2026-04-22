import "@mdxeditor/editor/style.css";
import {
  BoldItalicUnderlineToggles,
  headingsPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor";
import { useRef } from "react";

interface Props {
  initialMarkdown: string;
  onChange: (markdown: string) => void;
  ariaLabel: string;
}

/**
 * Thin MDXEditor wrapper with the plugins we actually need for an
 * invitation letter — headings (rare, but allowed), lists, quotes,
 * bold/italic/underline, undo/redo. No link/image/code plugins since
 * the letter is short plain prose.
 */
/** Form row that pairs a small mono label with the editor. Shared
 *  between the body and footer slots on the settings page. */
export function EditorSection({
  label,
  initialMarkdown,
  onChange,
  disabled,
}: {
  label: string;
  initialMarkdown: string;
  onChange: (m: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className={disabled ? "opacity-60 pointer-events-none" : ""}>
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3 mb-1.5">
        {label}
      </div>
      <SpeakerLetterEditor
        initialMarkdown={initialMarkdown}
        onChange={onChange}
        ariaLabel={label}
      />
    </div>
  );
}

export function SpeakerLetterEditor({ initialMarkdown, onChange, ariaLabel }: Props) {
  const ref = useRef<MDXEditorMethods>(null);
  return (
    <div className="rounded-lg border border-border bg-chalk">
      <MDXEditor
        ref={ref}
        markdown={initialMarkdown}
        onChange={onChange}
        aria-label={ariaLabel}
        plugins={[
          headingsPlugin(),
          listsPlugin(),
          quotePlugin(),
          thematicBreakPlugin(),
          markdownShortcutPlugin(),
          toolbarPlugin({
            toolbarContents: () => (
              <>
                <UndoRedo />
                <span className="mx-2 w-px h-5 bg-border" />
                <BoldItalicUnderlineToggles />
              </>
            ),
          }),
        ]}
        // `className` here is forwarded to MDXEditor's popup container
        // (a portal sibling), not the editor root — applying size classes
        // there creates a phantom tall element in the DOM that pushes the
        // page scrollbar. Size the content via `contentEditableClassName`
        // instead, which lands on the actual editable area.
        contentEditableClassName="prose prose-sm max-w-none min-h-[220px] px-4 py-3 font-serif text-walnut text-[15px] leading-relaxed focus:outline-none"
      />
    </div>
  );
}
