import { Link } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import type { MeetingType } from "@/lib/types";
import { defaultMeetingType } from "./ensureMeetingDoc";
import { HymnsSection } from "./sections/HymnsSection";
import { MusicSection } from "./sections/MusicSection";
import { PrayersSection } from "./sections/PrayersSection";
import { SacramentSection } from "./sections/SacramentSection";

function formatLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const TYPE_LABELS: Record<MeetingType, string> = {
  regular: "Regular sacrament meeting",
  fast_sunday: "Fast & Testimony meeting",
  ward_conference: "Ward conference",
  stake_conference: "Stake conference",
  general_conference: "General conference",
  other: "Other",
};

const NO_MEETING = new Set<MeetingType>(["stake_conference", "general_conference"]);
const HIDE_SPEAKERS = new Set<MeetingType>([
  "fast_sunday",
  "stake_conference",
  "general_conference",
]);

interface Props {
  date: string;
}

export function WeekEditor({ date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const settings = useWardSettings();
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);

  if (!wardId) return null;

  const nonMeeting = settings.data?.settings.nonMeetingSundays ?? [];
  const type = meeting.data?.meetingType ?? defaultMeetingType(date, nonMeeting);
  const cancellation = meeting.data?.cancellation;
  const cancelled = Boolean(cancellation?.cancelled);
  const isNonMeeting = NO_MEETING.has(type);
  const showSpeakers = !HIDE_SPEAKERS.has(type);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/schedule" className="hover:text-slate-700">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">{formatLong(date)}</h1>
        <p className="text-sm text-slate-500">{TYPE_LABELS[type]}</p>
      </header>

      {cancelled && (
        <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <strong>Meeting cancelled</strong>
          {cancellation?.reason && <span> — {cancellation.reason}</span>}
        </div>
      )}

      {isNonMeeting ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No sacrament meeting is held on {TYPE_LABELS[type].toLowerCase()} Sundays.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Prayers">
            <PrayersSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              nonMeetingSundays={nonMeeting}
            />
          </Section>
          <Section title="Music">
            <MusicSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              nonMeetingSundays={nonMeeting}
            />
          </Section>
          <Section title="Sacrament">
            <SacramentSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              nonMeetingSundays={nonMeeting}
            />
          </Section>
          {showSpeakers && (
            <Section title={`Speakers (${speakers.data.length})`}>
              {speakers.data.length === 0 ? (
                <Placeholder>No speakers yet. Add from the schedule view.</Placeholder>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {speakers.data.map((s) => (
                    <li key={s.id}>
                      <strong>{s.data.name}</strong>
                      {s.data.topic && <span className="text-slate-500"> · {s.data.topic}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Section>
          )}
          <Section title="Hymns" className="lg:col-span-2">
            <HymnsSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              type={type}
              nonMeetingSundays={nonMeeting}
            />
          </Section>
        </div>
      )}
    </main>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-slate-200 bg-white p-4 shadow-sm ${className ?? ""}`}
    >
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">{title}</h2>
      {children}
    </section>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-slate-400">{children}</p>;
}
