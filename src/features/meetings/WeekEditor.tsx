import { useState } from "react";
import { Link } from "react-router";
import { useMeeting, useSpeakers } from "@/hooks/useMeeting";
import { useWardSettings } from "@/hooks/useWardSettings";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentWardStore } from "@/stores/currentWardStore";
import { CancelDialog } from "./CancelDialog";
import { CancellationBanner } from "./CancellationBanner";
import { CopyFromPreviousButton } from "./CopyFromPreviousButton";
import { EditorPlaceholder, EditorSection } from "./EditorSection";
import { defaultMeetingType } from "./ensureMeetingDoc";
import { formatLongDate, HIDE_SPEAKER_TYPES, NO_MEETING_TYPES, TYPE_LABELS } from "./meetingLabels";
import { HymnsSection } from "./sections/HymnsSection";
import { MusicSection } from "./sections/MusicSection";
import { PrayersSection } from "./sections/PrayersSection";
import { SacramentSection } from "./sections/SacramentSection";
import { cancelMeeting } from "./updateMeeting";

interface Props {
  date: string;
}

export function WeekEditor({ date }: Props) {
  const wardId = useCurrentWardStore((s) => s.wardId);
  const authUid = useAuthStore((s) => s.user?.uid);
  const settings = useWardSettings();
  const meeting = useMeeting(date);
  const speakers = useSpeakers(date);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  if (!wardId) return null;

  const nonMeeting = settings.data?.settings.nonMeetingSundays ?? [];
  const type = meeting.data?.meetingType ?? defaultMeetingType(date, nonMeeting);
  const cancellation = meeting.data?.cancellation;
  const isNonMeeting = NO_MEETING_TYPES.has(type);
  const showSpeakers = !HIDE_SPEAKER_TYPES.has(type);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <nav className="mb-4 text-sm text-slate-500">
        <Link to="/schedule" className="hover:text-slate-700">
          ← Schedule
        </Link>
      </nav>
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-slate-900">{formatLongDate(date)}</h1>
        <p className="text-sm text-slate-500">{TYPE_LABELS[type]}</p>
      </header>

      <CancellationBanner
        wardId={wardId}
        date={date}
        cancellation={cancellation}
        onStartCancel={() => setConfirmingCancel(true)}
        isNonMeeting={isNonMeeting}
      />
      <CancelDialog
        open={confirmingCancel}
        onClose={() => setConfirmingCancel(false)}
        onConfirm={async (reason) => {
          if (!authUid) return;
          await cancelMeeting(wardId, date, reason, authUid, nonMeeting);
        }}
      />

      {isNonMeeting ? (
        <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          No sacrament meeting is held on {TYPE_LABELS[type].toLowerCase()} Sundays.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <EditorSection title="Prayers">
            <PrayersSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              nonMeetingSundays={nonMeeting}
            />
          </EditorSection>
          <EditorSection title="Music">
            <MusicSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              nonMeetingSundays={nonMeeting}
            />
            <div className="mt-3 border-t border-slate-200 pt-3">
              <CopyFromPreviousButton
                wardId={wardId}
                date={date}
                meeting={meeting.data}
                nonMeetingSundays={nonMeeting}
              />
            </div>
          </EditorSection>
          <EditorSection title="Sacrament">
            <SacramentSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              nonMeetingSundays={nonMeeting}
            />
          </EditorSection>
          {showSpeakers && (
            <EditorSection title={`Speakers (${speakers.data.length})`}>
              {speakers.data.length === 0 ? (
                <EditorPlaceholder>No speakers yet. Add from the schedule view.</EditorPlaceholder>
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
            </EditorSection>
          )}
          <EditorSection title="Hymns" className="lg:col-span-2">
            <HymnsSection
              wardId={wardId}
              date={date}
              meeting={meeting.data}
              type={type}
              nonMeetingSundays={nonMeeting}
            />
          </EditorSection>
        </div>
      )}
    </main>
  );
}
