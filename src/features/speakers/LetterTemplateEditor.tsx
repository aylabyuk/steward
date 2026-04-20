import { useEffect, useState } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useLetterTemplates } from "@/hooks/useLetterTemplates";
import { letterTemplateSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";

interface Draft {
  name: string;
  subject: string;
  body: string;
}

async function saveTemplate(wardId: string, id: string, draft: Draft): Promise<void> {
  const validated = letterTemplateSchema.parse(draft);
  await setDoc(
    doc(db, "wards", wardId, "letterTemplates", id),
    { ...validated, updatedAt: serverTimestamp() },
    { merge: true },
  );
}

function TemplateCard({ id, initial, wardId }: { id: string; initial: Draft; wardId: string }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(initial);
  }, [initial]);

  const dirty =
    draft.name !== initial.name || draft.subject !== initial.subject || draft.body !== initial.body;

  async function save() {
    setStatus("saving");
    setError(null);
    try {
      await saveTemplate(wardId, id, draft);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError((err as Error).message);
    }
  }

  return (
    <article className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Name</span>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Subject</span>
        <input
          value={draft.subject}
          onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          className="rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Body</span>
        <textarea
          value={draft.body}
          onChange={(e) => setDraft({ ...draft, body: e.target.value })}
          rows={10}
          className="rounded-md border border-slate-300 px-2 py-1 font-mono text-xs"
        />
      </label>
      <p className="text-xs text-slate-500">
        Placeholders: <code className="rounded bg-slate-100 px-1">{"{{speakerName}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{date}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{dayCount}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{topic}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{durationMinutes}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{wardName}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{bishopName}}"}</code>,{" "}
        <code className="rounded bg-slate-100 px-1">{"{{senderName}}"}</code>
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || status === "saving"}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && !dirty && <span className="text-xs text-green-700">Saved.</span>}
        {status === "error" && error && (
          <span className="text-xs text-red-700">Save failed: {error}</span>
        )}
      </div>
    </article>
  );
}

export function LetterTemplateEditor() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const { data, loading, error } = useLetterTemplates();

  if (!wardId) return null;
  if (error) return <p className="p-6 text-sm text-red-700">Failed to load: {error.message}</p>;
  if (loading) return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  if (data.length === 0) {
    return (
      <p className="p-6 text-sm text-slate-500">
        No templates yet. The bootstrap script seeds a default; rerun it or ask an admin.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {data.map((t) => (
        <TemplateCard key={t.id} id={t.id} wardId={wardId} initial={t.data} />
      ))}
    </div>
  );
}
