export interface TemplateVariableDoc {
  name: string;
  hint: string;
}

/** Shared `{{var}} — hint` table rendered above the editor for every
 *  template section. Keeping the list structural (rather than inlined
 *  into prose) lets each variable own its own line and keeps the
 *  layout predictable when the list grows. */
export function TemplateVariableList({
  variables,
}: {
  variables: readonly TemplateVariableDoc[];
}): React.ReactElement {
  return (
    <dl className="grid sm:grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 font-serif text-[12.5px] text-walnut-3">
      {variables.map((v) => (
        <div key={v.name} className="contents">
          <dt className="font-mono text-[11px] text-walnut-2">{`{{${v.name}}}`}</dt>
          <dd className="italic">{v.hint}</dd>
        </div>
      ))}
    </dl>
  );
}
