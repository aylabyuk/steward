import { useParams, Navigate } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { PrintLayout } from "./PrintLayout";
import {
  formatLongDate,
  orderedSpeakers,
  personName,
  speakerSequence,
} from "./programData";
import { RowFreeform, RowHymn, RowLabeled, RowSection } from "./programRows";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function CongregationProgram() {
  const { date } = useParams<{ date: string }>();
  const authed = useAuthStore((s) => s.status === "signed_in");
  const ward = useWardSettings();
  const meeting = useMeeting(date ?? null);
  const speakers = useSpeakers(date ?? null);

  if (!date || !ISO_DATE.test(date)) return <Navigate to="/schedule" replace />;
  if (!authed) return <Navigate to="/login" replace />;

  const ready = !ward.loading && !meeting.loading && !speakers.loading;
  const m = meeting.data;
  const approved = m?.status === "approved";

  if (ready && !approved) {
    return <NotApproved date={date} />;
  }

  const speakerList = orderedSpeakers(speakers.data);
  const sequence = speakerSequence(speakerList, m?.mid);
  const visitors = (m?.visitors ?? []).filter((v) => v.name.trim().length > 0);

  return (
    <PrintLayout ready={ready && approved}>
      <header className="mb-6 border-b-2 border-walnut pb-4">
        <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep">
          Sacrament meeting · {ward.data?.name ?? "Ward"}
        </div>
        <h1 className="font-display text-[32px] font-semibold text-walnut tracking-[-0.02em] m-0 mt-1">
          {formatLongDate(date)}
        </h1>
      </header>

      <RowSection title="Presiding & conducting">
        <RowLabeled label="Presiding" value={personName(m?.presiding)} />
        <RowLabeled label="Conducting" value={personName(m?.conducting)} />
        {visitors.length > 0 && (
          <RowLabeled
            label="Visitors"
            value={visitors.map((v) => (v.details ? `${v.name} (${v.details})` : v.name)).join(", ")}
          />
        )}
      </RowSection>

      {m?.showAnnouncements && (m?.announcements ?? "").trim().length > 0 && (
        <RowSection title="Announcements">
          <RowFreeform label="Announcements" value={m.announcements} />
        </RowSection>
      )}

      <RowSection title="Music">
        <RowLabeled label="Pianist" value={personName(m?.pianist)} />
        <RowLabeled label="Chorister" value={personName(m?.chorister)} />
      </RowSection>

      <RowSection title="Opening">
        <RowHymn label="Opening hymn" number={m?.openingHymn?.number} title={m?.openingHymn?.title} />
        <RowLabeled label="Invocation" value={personName(m?.openingPrayer)} />
      </RowSection>

      <RowSection title="Sacrament">
        <RowHymn
          label="Sacrament hymn"
          number={m?.sacramentHymn?.number}
          title={m?.sacramentHymn?.title}
        />
      </RowSection>

      <RowSection title="Speakers & music">
        {sequence.map((entry, i) =>
          entry.kind === "speaker" ? (
            <RowLabeled
              key={`s-${entry.data.id}`}
              label={`Speaker ${entry.index + 1}`}
              value={entry.data.topic ? `${entry.data.name} — ${entry.data.topic}` : entry.data.name}
            />
          ) : (
            <RowLabeled key={`mid-${i}`} label="Interlude" value={entry.label} />
          ),
        )}
      </RowSection>

      <RowSection title="Closing">
        <RowHymn label="Closing hymn" number={m?.closingHymn?.number} title={m?.closingHymn?.title} />
        <RowLabeled label="Benediction" value={personName(m?.benediction)} />
      </RowSection>

      <footer className="mt-10 pt-4 border-t border-border text-center font-serif italic text-[12px] text-walnut-3 print-hidden">
        Printing: use Cmd/Ctrl+P if the dialog didn't open automatically.
      </footer>
    </PrintLayout>
  );
}

function NotApproved({ date }: { date: string }) {
  return (
    <div className="min-h-screen grid place-items-center bg-parchment p-8 text-center">
      <div className="max-w-md">
        <p className="font-display text-[20px] text-walnut mb-2">Not yet approved</p>
        <p className="font-serif italic text-[13.5px] text-walnut-2">
          The program for <strong>{formatLongDate(date)}</strong> needs two bishopric approvals
          before it can be printed.
        </p>
      </div>
    </div>
  );
}
