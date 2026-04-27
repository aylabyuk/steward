/** Block-level renderers for the speaker letter walker. Lifted out
 *  of `renderLetterState` to keep the entry file under the per-file
 *  LOC cap. Each function maps one DecoratorNode's serialized shape
 *  to its read-only React presentation. */

export function renderLetterhead(
  node: { eyebrow?: string; title?: string; subtitle?: string },
  key: string,
) {
  return (
    <div key={key} className="text-center pb-5 border-b border-border mb-8">
      <div className="flex items-center justify-center gap-3.5 mb-3.5">
        <span className="w-9 h-9 border border-brass-soft rounded-full inline-flex items-center justify-center text-brass-deep text-lg">
          ✦
        </span>
      </div>
      {node.eyebrow && (
        <div className="font-mono text-[11px] tracking-[0.3em] uppercase text-walnut-3 mb-2">
          {node.eyebrow}
        </div>
      )}
      {node.title && (
        <div className="font-display text-[28px] italic text-walnut tracking-[-0.01em]">
          {node.title}
        </div>
      )}
      {node.subtitle && (
        <div className="mt-2.5 font-mono text-[10px] tracking-[0.22em] uppercase text-walnut-3">
          {node.subtitle}
        </div>
      )}
    </div>
  );
}

export function renderCallout(node: { label?: string; body?: string }, key: string) {
  return (
    <div
      key={key}
      className="my-5 px-6 py-4 bg-linear-to-b from-brass-soft/15 to-brass-soft/5 border-l-2 border-brass rounded-r-md"
    >
      {node.label && (
        <div className="font-mono text-[9.5px] tracking-[0.22em] uppercase text-brass-deep mb-2">
          {node.label}
        </div>
      )}
      {node.body && <div className="font-display text-[20px] italic text-walnut">{node.body}</div>}
    </div>
  );
}

export function renderSignature(node: { closing?: string; signatory?: string }, key: string) {
  return (
    <div key={key} className="mt-7 mb-2">
      {node.closing && (
        <div className="font-serif italic text-[16px] text-walnut mb-2">{node.closing}</div>
      )}
      <div className="border-b border-walnut-3 w-65 mb-1.5" />
      {node.signatory && (
        <div className="font-mono text-[10px] tracking-[0.18em] uppercase text-walnut-3">
          {node.signatory}
        </div>
      )}
    </div>
  );
}

export function renderImage(
  node: { src?: string; alt?: string; widthPct?: number; caption?: string },
  key: string,
) {
  if (!node.src) return null;
  return (
    <figure
      key={key}
      className="my-4 mx-auto flex flex-col items-center"
      style={{ width: `${node.widthPct ?? 60}%` }}
    >
      <img src={node.src} alt={node.alt ?? ""} className="max-w-full block" />
      {node.caption && (
        <figcaption className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-walnut-3">
          {node.caption}
        </figcaption>
      )}
    </figure>
  );
}
