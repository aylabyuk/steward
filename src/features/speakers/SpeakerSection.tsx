import { useState } from "react";
import { Link } from "react-router";
import { useSpeakers } from "@/hooks/useMeeting";
import type { MeetingType, NonMeetingSunday } from "@/lib/types";
import { leadTimeSeverity, type LeadTimeSeverity } from "./leadTime";
import { SpeakerForm } from "./SpeakerForm";

interface Props {
  wardId: string;
  date: string;
  type: MeetingType;
  leadTimeDays: number;
  nonMeetingSundays: readonly NonMeetingSunday[];
}

const SEVERITY_STYLE: Record<Exclude<LeadTimeSeverity, "none">, string> = {
  warn: "bg-yellow-50 text-yellow-800 border-yellow-200",
  urgent: "bg-red-50 text-red-800 border-red-200",
};

const SEVERITY_TEXT: Record<Exclude<LeadTimeSeverity, "none">, string> = {
  warn: "Less than 2 weeks notice — consider a later week.",
  urgent: "Short notice. Confirm directly.",
};

const HAS_SPEAKERS: ReadonlySet<MeetingType> = new Set(["regular", "ward_conference", "other"]);

export function SpeakerSection({ wardId, date, type, leadTimeDays, nonMeetingSundays }: Props) {
  const { data: speakers } = useSpeakers(date);
  const [adding, setAdding] = useState(false);

  if (type === "fast_sunday") {
    return <p className="text-xs text-slate-500">Testimony meeting — no assigned speakers.</p>;
  }
  if (!HAS_SPEAKERS.has(type)) return null;

  const severity = leadTimeSeverity(new Date(), date, leadTimeDays);

  return (
    <section className="flex flex-col gap-2 border-t border-slate-200 pt-3">
      {severity !== "none" && (
        <p className={`rounded-md border px-2 py-1 text-xs ${SEVERITY_STYLE[severity]}`}>
          {SEVERITY_TEXT[severity]}
        </p>
      )}
      <ul className="flex flex-col gap-1 text-sm">
        {speakers.length === 0 ? (
          <li className="text-slate-400">No speakers yet.</li>
        ) : (
          speakers.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-2">
              <span>
                <strong className="text-slate-900">{s.data.name}</strong>
                {s.data.topic && <span className="text-slate-500"> · {s.data.topic}</span>}
              </span>
              <Link
                to={`/week/${date}/speaker/${s.id}/letter`}
                className="text-xs text-blue-600 hover:underline"
              >
                Letter
              </Link>
            </li>
          ))
        )}
      </ul>
      {adding ? (
        <SpeakerForm
          wardId={wardId}
          date={date}
          nonMeetingSundays={nonMeetingSundays}
          onCancel={() => setAdding(false)}
          onAdded={() => setAdding(false)}
        />
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="self-start text-sm text-blue-600 hover:underline"
        >
          + Add speaker
        </button>
      )}
    </section>
  );
}
