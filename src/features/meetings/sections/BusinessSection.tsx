import { useEffect, useState } from "react";
import type { NonMeetingSunday, SacramentMeeting } from "@/lib/types";
import { ProgramSection } from "../program/ProgramSection";
import { updateMeetingField } from "../updateMeeting";

type TextField = "wardBusiness" | "stakeBusiness" | "announcements";

interface Props {
  wardId: string;
  date: string;
  meeting: SacramentMeeting | null;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

export function BusinessSection({ wardId, date, meeting, nonMeetingSundays }: Props) {
  async function setText(field: TextField, value: string) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { [field]: value });
  }
  async function setShow(next: boolean) {
    await updateMeetingField(wardId, date, nonMeetingSundays, { showAnnouncements: next });
  }
  const showAnnouncements = meeting?.showAnnouncements ?? true;
  return (
    <ProgramSection id="sec-notes" label="Business & announcements">
      <div className="flex flex-col gap-3.5">
        <FieldRow
          label="Ward business"
          optional
          placeholder="Callings to sustain, changes in records, etc."
          value={meeting?.wardBusiness ?? ""}
          onCommit={(v) => setText("wardBusiness", v)}
        />
        <FieldRow
          label="Stake business"
          optional
          placeholder="Anything from the stake presidency to be presented."
          value={meeting?.stakeBusiness ?? ""}
          onCommit={(v) => setText("stakeBusiness", v)}
        />
        <FieldRow
          label="Announcements"
          optional
          placeholder="e.g. Youth temple trip — Saturday, May 23"
          helper="Shown on the congregation print only when the announcements toggle is on."
          value={meeting?.announcements ?? ""}
          onCommit={(v) => setText("announcements", v)}
        />
        <ShowAnnouncementsToggle checked={showAnnouncements} onChange={(v) => void setShow(v)} />
      </div>
    </ProgramSection>
  );
}

interface FieldRowProps {
  label: string;
  optional?: boolean;
  placeholder?: string;
  helper?: string;
  value: string;
  onCommit: (next: string) => Promise<void>;
}

function FieldRow({ label, optional, placeholder, helper, value, onCommit }: FieldRowProps) {
  const [local, setLocal] = useState(value);
  useEffect(() => {
    setLocal(value);
  }, [value]);
  return (
    <label className="flex flex-col gap-1.5">
      <span className="flex items-center gap-1.5 text-[13.5px] font-sans font-medium text-walnut-2">
        {label}
        {optional && (
          <span className="font-mono text-[9.5px] uppercase tracking-widest text-walnut-3 font-normal">
            Optional
          </span>
        )}
      </span>
      <textarea
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => {
          if (local !== value) void onCommit(local);
        }}
        rows={3}
        placeholder={placeholder}
        className="font-sans text-[14px] leading-[1.55] px-3 py-2.5 bg-parchment border border-transparent rounded-md text-walnut min-h-17.5 w-full resize-y transition-colors placeholder:text-walnut-3 placeholder:italic hover:border-border-strong hover:bg-chalk focus:outline-none focus:border-bordeaux focus:bg-chalk focus:ring-2 focus:ring-bordeaux/15"
      />
      {helper && <span className="font-serif italic text-[12.5px] text-walnut-3">{helper}</span>}
    </label>
  );
}

function ShowAnnouncementsToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2.5 pt-2.5 cursor-pointer w-fit">
      <input
        type="checkbox"
        className="absolute opacity-0 pointer-events-none"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span
        aria-hidden
        className={`w-8.5 h-5 rounded-full border relative transition-colors ${
          checked ? "bg-bordeaux border-bordeaux-deep" : "bg-parchment-2 border-border-strong"
        }`}
      >
        <span
          className={`absolute top-[1.5px] left-0.5 w-3.5 h-3.5 bg-chalk rounded-full shadow transition-transform ${
            checked ? "translate-x-3.5" : ""
          }`}
        />
      </span>
      <span className="font-sans text-[13.5px] text-walnut">
        Include announcements on printed program
      </span>
    </label>
  );
}
