import type { WithId } from "@/hooks/_sub";
import type { Speaker } from "@/lib/types";
import { EditorPlaceholder, EditorSection } from "../EditorSection";

interface Props {
  speakers: readonly WithId<Speaker>[];
}

export function SpeakersSection({ speakers }: Props) {
  return (
    <EditorSection title={`Speakers (${speakers.length})`}>
      {speakers.length === 0 ? (
        <EditorPlaceholder>No speakers yet. Add from the schedule view.</EditorPlaceholder>
      ) : (
        <ul className="flex flex-col gap-1 text-sm">
          {speakers.map((s) => (
            <li key={s.id}>
              <strong>{s.data.name}</strong>
              {s.data.topic && <span className="text-walnut-2"> · {s.data.topic}</span>}
            </li>
          ))}
        </ul>
      )}
    </EditorSection>
  );
}
