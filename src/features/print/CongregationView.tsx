import { useState } from "react";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { PrintGate } from "./PrintGate";
import { PrintToolbar } from "./PrintToolbar";
import { formatHymn, formatLongDate, formatPerson } from "./printFormat";

interface Props {
  date: string;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[8rem_1fr] gap-3 py-1">
      <dt className="text-slate-600">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}

export function CongregationView({ date }: Props) {
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);
  const settings = useWardSettings();
  const [includeAnnouncements, setIncludeAnnouncements] = useState(false);

  const blessers = (meeting.data?.sacramentBlessers ?? [])
    .map((b) => formatPerson(b))
    .filter((v) => v !== "—")
    .join(", ");

  return (
    <>
      <PrintToolbar backTo={`/week/${date}`} backLabel="Back to the week">
        <label className="flex cursor-pointer items-center gap-1 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={includeAnnouncements}
            onChange={(e) => setIncludeAnnouncements(e.target.checked)}
          />
          Include announcements
        </label>
      </PrintToolbar>
      <PrintGate date={date} meeting={meeting.data} loading={meeting.loading}>
        <article className="mx-auto max-w-2xl px-6 py-8 text-slate-900 print:max-w-none print:px-0 print:py-0">
          <header className="mb-6 text-center">
            <h1 className="text-xl font-semibold">{settings.data?.name ?? ""}</h1>
            <p className="text-sm text-slate-600">Sacrament meeting — {formatLongDate(date)}</p>
          </header>

          <section className="text-sm">
            <dl>
              <Row label="Opening hymn" value={formatHymn(meeting.data?.openingHymn)} />
              <Row label="Sacrament hymn" value={formatHymn(meeting.data?.sacramentHymn)} />
              {blessers && <Row label="Sacrament" value={blessers} />}
              {speakers.data.map((s, i) => (
                <Row
                  key={s.id}
                  label={`Speaker ${i + 1}`}
                  value={s.data.topic ? `${s.data.name} — ${s.data.topic}` : s.data.name}
                />
              ))}
              {meeting.data?.specialNumber && (
                <Row
                  label="Special number"
                  value={`${meeting.data.specialNumber.performer}${
                    meeting.data.specialNumber.piece ? ` — ${meeting.data.specialNumber.piece}` : ""
                  }`}
                />
              )}
              <Row label="Closing hymn" value={formatHymn(meeting.data?.closingHymn)} />
            </dl>
          </section>

          {includeAnnouncements && (meeting.data?.announcements ?? "").trim() && (
            <section className="mt-6">
              <h2 className="mb-2 border-b border-slate-300 pb-1 text-sm font-semibold">
                Announcements
              </h2>
              <p className="whitespace-pre-wrap text-sm">{meeting.data?.announcements}</p>
            </section>
          )}
        </article>
      </PrintGate>
    </>
  );
}
