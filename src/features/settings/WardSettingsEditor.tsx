import { useEffect, useMemo, useState } from "react";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { useWardSettings } from "@/hooks/useWardSettings";
import { type WardSettings, wardSettingsSchema } from "@/lib/types";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { NonMeetingSundaysEditor } from "./NonMeetingSundaysEditor";
import { NudgeScheduleEditor } from "./NudgeScheduleEditor";
import { saveWardSettings } from "./saveWardSettings";
import { SettingsField } from "./SettingsField";
import { timezoneSuggestions } from "./timezone";
import {
  HORIZON_MAX,
  HORIZON_MIN,
  LEAD_MAX,
  LEAD_MIN,
  validateWardSettings,
} from "./wardSettingsValidate";

export function WardSettingsEditor() {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const ward = useWardSettings();
  const me = useCurrentMember();
  const canEdit = me?.data.role === "bishopric" && me.data.active;
  const tzOptions = useMemo(() => timezoneSuggestions(), []);
  const [draft, setDraft] = useState<WardSettings | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (ward.data) setDraft(ward.data.settings);
  }, [ward.data]);

  if (!wardId || !draft || !ward.data) {
    return <p className="text-sm text-slate-500">Loading…</p>;
  }
  const errors = validateWardSettings(draft);
  const dirty = JSON.stringify(draft) !== JSON.stringify(ward.data.settings);
  const hasErrors = Object.keys(errors).length > 0;

  function patch<K extends keyof WardSettings>(key: K, value: WardSettings[K]) {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
  }

  async function save() {
    if (!wardId || !draft) return;
    const parsed = wardSettingsSchema.safeParse(draft);
    if (!parsed.success) {
      setErrorMsg(parsed.error.message);
      setStatus("error");
      return;
    }
    setStatus("saving");
    setErrorMsg(null);
    try {
      await saveWardSettings(wardId, parsed.data);
      setStatus("saved");
    } catch (e) {
      setErrorMsg((e as Error).message);
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      className="flex flex-col gap-6"
    >
      <SettingsField label="Timezone" error={errors.timezone}>
        <input
          list="ward-tz-list"
          value={draft.timezone}
          onChange={(e) => patch("timezone", e.target.value)}
          disabled={!canEdit}
          className="w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
        <datalist id="ward-tz-list">
          {tzOptions.map((tz) => (
            <option key={tz} value={tz} />
          ))}
        </datalist>
      </SettingsField>
      <SettingsField label="Speaker lead time (days)" error={errors.speakerLeadTimeDays}>
        <input
          type="number"
          min={LEAD_MIN}
          max={LEAD_MAX}
          value={draft.speakerLeadTimeDays}
          onChange={(e) => patch("speakerLeadTimeDays", Number(e.target.value))}
          disabled={!canEdit}
          className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </SettingsField>
      <SettingsField label="Schedule horizon (weeks)" error={errors.scheduleHorizonWeeks}>
        <input
          type="number"
          min={HORIZON_MIN}
          max={HORIZON_MAX}
          value={draft.scheduleHorizonWeeks}
          onChange={(e) => patch("scheduleHorizonWeeks", Number(e.target.value))}
          disabled={!canEdit}
          className="w-32 rounded-md border border-slate-300 px-2 py-1 text-sm"
        />
      </SettingsField>
      <SettingsField label="Finalization nudges">
        <NudgeScheduleEditor
          value={draft.nudgeSchedule}
          onChange={(v) => patch("nudgeSchedule", v)}
          disabled={!canEdit}
        />
      </SettingsField>
      <SettingsField label="Non-meeting Sundays">
        <NonMeetingSundaysEditor
          value={draft.nonMeetingSundays}
          onChange={(v) => patch("nonMeetingSundays", v)}
          disabled={!canEdit}
        />
      </SettingsField>
      {!canEdit && (
        <p className="text-xs text-slate-500">Only bishopric members can change ward settings.</p>
      )}
      {errorMsg && <p className="text-xs text-red-600">{errorMsg}</p>}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!canEdit || !dirty || hasErrors || status === "saving"}
          className="rounded-md bg-slate-900 px-3 py-1 text-sm text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {status === "saved" && !dirty && <span className="text-xs text-green-700">Saved.</span>}
      </div>
    </form>
  );
}
