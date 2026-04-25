import { AutoLinkPlugin, type LinkMatcher } from "@lexical/react/LexicalAutoLinkPlugin";

const URL_RE = /(https?:\/\/[\w\-._~:/?#[\]@!$&'()*+,;=%]+|www\.[\w\-._~:/?#[\]@!$&'()*+,;=%]+)/i;
const EMAIL_RE = /[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/i;

const MATCHERS: LinkMatcher[] = [
  (text) => {
    const m = URL_RE.exec(text);
    if (!m) return null;
    const matched = m[0];
    return {
      index: m.index,
      length: matched.length,
      text: matched,
      url: matched.startsWith("http") ? matched : `https://${matched}`,
    };
  },
  (text) => {
    const m = EMAIL_RE.exec(text);
    if (!m) return null;
    return {
      index: m.index,
      length: m[0].length,
      text: m[0],
      url: `mailto:${m[0]}`,
    };
  },
];

/** Detects URLs + email addresses as the bishop types and wraps them
 *  in `LinkNode` automatically. Pairs with `LinkPlugin` (already
 *  mounted in `PageEditorComposer`) so links render with the editor's
 *  link styling and round-trip through markdown. */
export function PageEditorAutoLink() {
  return <AutoLinkPlugin matchers={MATCHERS} />;
}
