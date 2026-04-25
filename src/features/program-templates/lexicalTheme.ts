import type { EditorThemeClasses } from "lexical";

/** Class names Lexical attaches to the rendered HTML for each node
 *  type. Combined with `@tailwindcss/typography`'s `prose` on the
 *  ContentEditable, this gives the editor the same look as the
 *  speaker letter / template surfaces did with MDXEditor. */
export const lexicalTheme: EditorThemeClasses = {
  paragraph: "my-1",
  heading: {
    h1: "font-display text-[22px] font-semibold mt-2 mb-1",
    h2: "font-display text-[19px] font-semibold mt-2 mb-1",
    h3: "font-display text-[17px] font-semibold mt-1.5 mb-1",
  },
  list: {
    ul: "list-disc pl-6 my-1.5",
    ol: "list-decimal pl-6 my-1.5",
    listitem: "my-0.5",
  },
  quote: "border-l-4 border-walnut-3/60 pl-3 italic text-walnut-2 my-2",
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    underlineStrikethrough: "underline line-through",
    subscript: "align-sub text-[0.75em]",
    superscript: "align-super text-[0.75em]",
    code: "font-mono text-[0.92em] bg-parchment-2 px-1 py-px rounded",
  },
};
