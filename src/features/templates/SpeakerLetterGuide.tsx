interface Variable {
  name: string;
  description: string;
}

const VARIABLES: Variable[] = [
  { name: "speakerName", description: "The speaker's full name." },
  {
    name: "topic",
    description: 'Their assigned topic (falls back to "a topic of your choosing" if blank).',
  },
  { name: "date", description: "The assigned Sunday in long form (e.g. Sunday, April 26, 2026)." },
  { name: "today", description: "Today's date at the moment of sending." },
  { name: "wardName", description: "The ward name from Ward Settings." },
  { name: "inviterName", description: "Your display name from your member record." },
];

/** Collapsible editor-column hint block. Lists the speaker-letter
 *  variables and a short formatting note. Used both on the ward-level
 *  settings editor (`/settings/templates/speakers`) and the
 *  per-speaker Prepare Invitation page. Variables wrapped in
 *  `{{braces}}` are substituted at send time — leave them as-is in
 *  the editor. */
export function SpeakerLetterGuide() {
  return (
    <details className="rounded-md border border-border bg-parchment-2 px-3.5 py-2.5 text-[13px] text-walnut-2 open:pb-3.5">
      <summary className="cursor-pointer font-mono text-[10px] uppercase tracking-[0.14em] text-brass-deep select-none">
        How to edit — variables & formatting
      </summary>
      <p className="mt-2.5 font-serif leading-relaxed">
        Type directly to edit. Use the toolbar above each editor for <strong>bold</strong>,{" "}
        <em>italic</em>, lists, or quotes. Tokens wrapped in{" "}
        <code className="font-mono text-[12px]">{"{{braces}}"}</code> stay as-is in the editor — the
        system fills them in when the invitation is sent.
      </p>
      <dl className="mt-3 grid gap-x-4 gap-y-1.5 grid-cols-[max-content_minmax(0,1fr)] items-baseline">
        {VARIABLES.map((v) => (
          <div key={v.name} className="contents">
            <dt className="font-mono text-[12px] text-bordeaux whitespace-nowrap">
              {"{{"}
              {v.name}
              {"}}"}
            </dt>
            <dd className="font-serif text-[12.5px] text-walnut-3">{v.description}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
