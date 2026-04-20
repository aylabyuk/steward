import { useEffect, useState } from "react";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link } from "react-router";
import { useLetterTemplate } from "@/hooks/useLetterTemplates";
import { useSpeaker } from "@/hooks/useSpeaker";
import { useWardMembers } from "@/hooks/useWardMembers";
import { useWardSettings } from "@/hooks/useWardSettings";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { renderTemplate } from "./renderTemplate";
import { SendActions } from "./SendActions";
import { buildTemplateValues } from "./templateValues";

const DEFAULT_TEMPLATE_ID = "speaker-invitation";

interface Props {
  date: string;
  speakerId: string;
}

export function LetterComposer({ date, speakerId }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUser = useAuthStore((s) => s.user);
  const speakerState = useSpeaker(date, speakerId);
  const wardState = useWardSettings();
  const membersState = useWardMembers();
  const templateState = useLetterTemplate(DEFAULT_TEMPLATE_ID);

  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [initialized, setInitialized] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const speaker = speakerState.data;
  const ward = wardState.data;
  const template = templateState.data;

  useEffect(() => {
    if (initialized || !speaker || !template) return;
    const bishopMember = membersState.data.find(
      (m) => m.data.calling === "bishop" && m.data.active,
    );
    const values = buildTemplateValues({
      date,
      speaker,
      ward,
      bishop: bishopMember?.data ?? null,
      senderName: authUser?.displayName ?? authUser?.email ?? "",
    });
    setSubject(renderTemplate(template.subject, values));
    const storedBody = speaker.letterBody;
    setBody(
      storedBody && storedBody.length > 0 ? storedBody : renderTemplate(template.body, values),
    );
    setInitialized(true);
  }, [initialized, speaker, template, ward, membersState.data, authUser, date]);

  async function saveDraft() {
    if (!wardId) return;
    await updateDoc(doc(db, "wards", wardId, "meetings", date, "speakers", speakerId), {
      letterBody: body,
      letterUpdatedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    setSavedAt(Date.now());
  }

  if (speakerState.loading || !speaker) {
    return <p className="p-6 text-sm text-slate-500">Loading…</p>;
  }
  if (!template) {
    return (
      <p className="p-6 text-sm text-slate-500">
        No <code>speaker-invitation</code> template yet. Create one at{" "}
        <Link to="/settings/letter-templates" className="text-blue-600 hover:underline">
          Letter templates
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-2 rounded-md border border-slate-200 bg-slate-50 p-3 text-xs">
        <dt className="text-slate-500">To</dt>
        <dd className="font-mono text-slate-800">{speaker.email || "(no email on speaker)"}</dd>
        <dt className="text-slate-500">Status</dt>
        <dd className="text-slate-800">{speaker.status.replace(/_/g, " ")}</dd>
      </dl>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Subject</span>
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="rounded-md border border-slate-300 px-2 py-1"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="font-medium text-slate-700">Body</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={18}
          className="rounded-md border border-slate-300 px-2 py-2 font-mono text-xs"
        />
      </label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void saveDraft()}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white"
        >
          Save draft
        </button>
        {savedAt && (
          <span className="text-xs text-green-700">
            Saved at {new Date(savedAt).toLocaleTimeString()}.
          </span>
        )}
      </div>
      <SendActions
        date={date}
        speakerId={speakerId}
        speaker={speaker}
        subject={subject}
        body={body}
        onBeforeAction={saveDraft}
      />
    </div>
  );
}
