import { useEffect, useState } from "react";
import type { NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { EditorSection } from "../EditorSection";
import { updateMeetingField } from "../updateMeeting";

type Field = "wardBusiness" | "stakeBusiness" | "announcements";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

interface FieldRowProps {
  label: string;
  hint?: string;
  value: string;
  onCommit: (next: string) => Promise<void>;
}

function FieldRow({ label, hint, value, onCommit }: FieldRowProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-walnut">{label}</span>
      {hint && <span className="text-xs text-walnut-2">{hint}</span>}
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) void onCommit(local);
        }}
        rows={3}
        className="rounded-md border border-border px-2 py-1 text-sm"
      />
    </label>
  );
}

export function BusinessSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  async function set(field: Field, value: string) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: value });
  }
  return (
    <EditorSection title="Business & announcements" className="lg:col-span-2">
      <div className="flex flex-col gap-4">
        <FieldRow
          label="Ward business"
          value={meeting?.wardBusiness ?? ""}
          onCommit={(v) => set("wardBusiness", v)}
        />
        <FieldRow
          label="Stake business"
          value={meeting?.stakeBusiness ?? ""}
          onCommit={(v) => set("stakeBusiness", v)}
        />
        <FieldRow
          label="Announcements"
          hint="Shown on the congregation print only when the announcements toggle is on."
          value={meeting?.announcements ?? ""}
          onCommit={(v) => set("announcements", v)}
        />
      </div>
    </EditorSection>
  );
}
