import { useEffect, useState } from "react";
import type { PrayerRole, SacramentMeeting } from "@/lib/types";
import { useMeeting } from "@/hooks/useMeeting";
import { usePrayerParticipant } from "@/features/prayers/usePrayerParticipant";

interface Result {
  /** Effective name — participant doc takes precedence over the
   *  inline `meeting.{role}.person.name` Assignment row. */
  name: string;
  email: string;
  phone: string;
  /** Setters for the local form inputs. Persistence happens on Send /
   *  Save (via upsertPrayerParticipant) so the bishop can edit
   *  multiple fields before committing. */
  setName: (next: string) => void;
  setEmail: (next: string) => void;
  setPhone: (next: string) => void;
  /** Live participant doc — null when the bishop hasn't yet
   *  promoted this slot beyond the lightweight inline Assignment. */
  participant: ReturnType<typeof usePrayerParticipant>["data"];
  meeting: SacramentMeeting | null;
  loading: boolean;
}

/** Combines `usePrayerParticipant` + `useMeeting` so the plan-prayers
 *  card seeds from whichever name is current, then keeps local form
 *  state for in-card editing. */
export function usePrayerPlanRow(date: string, role: PrayerRole): Result {
  const meetingSnap = useMeeting(date);
  const meeting = meetingSnap.data ?? null;
  const participantSnap = usePrayerParticipant(date, role);
  const participant = participantSnap.data ?? null;

  const inlineAssignment = role === "opening" ? meeting?.openingPrayer : meeting?.benediction;
  const seedName = participant?.name ?? inlineAssignment?.person?.name ?? "";
  const seedEmail = participant?.email ?? "";
  const seedPhone = participant?.phone ?? "";

  const [name, setName] = useState(seedName);
  const [email, setEmail] = useState(seedEmail);
  const [phone, setPhone] = useState(seedPhone);

  // Keep local state in sync when the underlying docs hydrate or
  // change from another tab. Strict equality check avoids re-setting
  // mid-typing.
  useEffect(() => {
    setName(seedName);
  }, [seedName]);
  useEffect(() => {
    setEmail(seedEmail);
  }, [seedEmail]);
  useEffect(() => {
    setPhone(seedPhone);
  }, [seedPhone]);

  return {
    name,
    email,
    phone,
    setName,
    setEmail,
    setPhone,
    participant,
    meeting,
    loading: meetingSnap.loading || participantSnap.loading,
  };
}
