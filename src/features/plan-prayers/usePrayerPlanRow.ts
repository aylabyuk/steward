import { useEffect, useRef, useState } from "react";
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
 *  card seeds from whichever name is current, then holds local form
 *  state for in-card editing. Seeds **once** on first hydration via
 *  a ref guard — subsequent Firestore snapshot updates (status
 *  flips, name mirroring after a wizard write, etc.) MUST NOT
 *  overwrite whatever the bishop has typed. Mirrors the speaker
 *  RosterStep's seededRef pattern. */
export function usePrayerPlanRow(date: string, role: PrayerRole): Result {
  const meetingSnap = useMeeting(date);
  const meeting = meetingSnap.data ?? null;
  const participantSnap = usePrayerParticipant(date, role);
  const participant = participantSnap.data ?? null;

  const inlineAssignment = role === "opening" ? meeting?.openingPrayer : meeting?.benediction;
  const seedName = participant?.name ?? inlineAssignment?.person?.name ?? "";
  const seedEmail = participant?.email ?? "";
  const seedPhone = participant?.phone ?? "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const seededRef = useRef(false);

  useEffect(() => {
    if (seededRef.current) return;
    if (meetingSnap.loading || participantSnap.loading) return;
    // If the bishop started typing before subscriptions hydrated,
    // their input wins — skip the seed entirely. Typical flow has
    // subscriptions in-flight before any keystroke; this guard is
    // defensive.
    if (!name && !email && !phone) {
      setName(seedName);
      setEmail(seedEmail);
      setPhone(seedPhone);
    }
    seededRef.current = true;
  }, [
    meetingSnap.loading,
    participantSnap.loading,
    seedName,
    seedEmail,
    seedPhone,
    name,
    email,
    phone,
  ]);

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
