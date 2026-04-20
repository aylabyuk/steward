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
    <div className="grid grid-cols-[10rem_1fr] gap-2 py-1 text-sm">
      <dt className="font-medium text-slate-600">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}

export function ConductingView({ date }: Props) {
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);
  const settings = useWardSettings();

  return (
    <>
      <PrintToolbar backTo={`/week/${date}`} backLabel="Back to the week" />
      <PrintGate date={date} meeting={meeting.data} loading={meeting.loading}>
        <article className="mx-auto max-w-3xl px-6 py-8 text-slate-900 print:max-w-none print:px-0 print:py-0">
          <header className="mb-6">
            <h1 className="text-xl font-semibold">{settings.data?.name ?? ""}</h1>
            <p className="text-sm text-slate-600">Conducting program — {formatLongDate(date)}</p>
          </header>

          <section>
            <h2 className="mb-2 border-b border-slate-300 pb-1 text-base font-semibold">Program</h2>
            <dl className="grid grid-cols-1">
              <Row label="Opening hymn" value={formatHymn(meeting.data?.openingHymn)} />
              <Row label="Opening prayer" value={formatPerson(meeting.data?.openingPrayer)} />
              <Row label="Ward business" value={meeting.data?.wardBusiness || "—"} />
              <Row label="Stake business" value={meeting.data?.stakeBusiness || "—"} />
              <Row label="Sacrament hymn" value={formatHymn(meeting.data?.sacramentHymn)} />
              <Row label="Sacrament — bread" value={formatPerson(meeting.data?.sacramentBread)} />
              <Row
                label="Sacrament — blessers"
                value={
                  (meeting.data?.sacramentBlessers ?? [])
                    .map((b) => formatPerson(b))
                    .filter((v) => v !== "—")
                    .join(", ") || "—"
                }
              />
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
              <Row label="Benediction" value={formatPerson(meeting.data?.benediction)} />
            </dl>
          </section>

          <section className="mt-6">
            <h2 className="mb-2 border-b border-slate-300 pb-1 text-base font-semibold">Music</h2>
            <Row label="Pianist" value={formatPerson(meeting.data?.pianist)} />
            <Row label="Chorister" value={formatPerson(meeting.data?.chorister)} />
          </section>

          {(meeting.data?.announcements ?? "").trim() && (
            <section className="mt-6">
              <h2 className="mb-2 border-b border-slate-300 pb-1 text-base font-semibold">
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
