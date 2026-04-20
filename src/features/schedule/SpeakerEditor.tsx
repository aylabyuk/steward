import { useState } from "react";
import type { Speaker, SpeakerRole } from "@/lib/types";
import { StatePill } from "./StatePill";

const ROLES: SpeakerRole[] = ["Member", "Youth", "High Council", "Visiting"];

interface Props {
  speaker: Partial<Speaker>;
  onSave: (speaker: Partial<Speaker>) => Promise<void>;
  onCancel: () => void;
}

export function SpeakerEditor({ speaker, onSave, onCancel }: Props) {
  const [name, setName] = useState(speaker.name ?? "");
  const [email, setEmail] = useState(speaker.email ?? "");
  const [topic, setTopic] = useState(speaker.topic ?? "");
  const [role, setRole] = useState<SpeakerRole>(speaker.role ?? "Member");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        name,
        email: email || undefined,
        topic: topic || undefined,
        role,
        status: speaker.status ?? "planned",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-walnut mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bordeaux"
          placeholder="Speaker name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-walnut mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bordeaux"
          placeholder="speaker@example.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-walnut mb-1">Topic</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-bordeaux"
          placeholder="Talk topic"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-walnut mb-2">Role</label>
        <div className="grid grid-cols-2 gap-2">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`px-3 py-2 text-sm rounded-md border transition ${
                role === r
                  ? "bg-brass-soft text-walnut border-brass"
                  : "bg-parchment-2 text-walnut border-border hover:border-border-strong"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {speaker.status && (
        <div>
          <label className="block text-sm font-medium text-walnut mb-2">Status</label>
          <StatePill status={speaker.status} />
        </div>
      )}

      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={!name || saving}
          className="flex-1 px-4 py-2 bg-bordeaux text-chalk rounded-md font-medium hover:bg-bordeaux-deep disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-border text-walnut rounded-md font-medium hover:bg-parchment-2 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
