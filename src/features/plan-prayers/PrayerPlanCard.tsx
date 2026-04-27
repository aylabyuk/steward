import { Link } from "react-router";
import type { PrayerRole } from "@/lib/types";
import { isPlausiblePhone } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { SpeakerStatusChip } from "@/features/plan-speakers/SpeakerStatusChip";
import { useAuthStore } from "@/stores/authStore";
import { useCurrentMember } from "@/hooks/useCurrentMember";
import { PrayerPlanField } from "./PrayerPlanField";
import { usePrayerPlanCardActions } from "./usePrayerPlanCardActions";
import { usePrayerPlanRow } from "./usePrayerPlanRow";

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "Opening prayer",
  benediction: "Benediction",
};

interface Props {
  wardId: string;
  date: string;
  role: PrayerRole;
}

/** One card per prayer slot. Lightweight roster + invitation
 *  controls — no multi-step wizard since there are only 2 slots. */
export function PrayerPlanCard({ wardId, date, role }: Props) {
  const me = useCurrentMember();
  const authUser = useAuthStore((s) => s.user);
  const inviterName =
    me?.data.displayName ?? authUser?.displayName ?? authUser?.email ?? "The bishopric";
  const row = usePrayerPlanRow(date, role);

  const status = row.participant?.status ?? "planned";
  const trimmedName = row.name.trim();
  const hasEmail = isValidEmail(row.email);
  const hasPhone = isPlausiblePhone(row.phone);
  const alreadyInvited = status === "invited" || status === "confirmed";

  const actions = usePrayerPlanCardActions({
    wardId,
    date,
    role,
    inviterName,
    bishopEmail: authUser?.email ?? "",
    name: row.name,
    email: row.email,
    phone: row.phone,
  });

  const channels = ([hasEmail && "email", hasPhone && "sms"] as const).filter(
    (c): c is "email" | "sms" => Boolean(c),
  );
  const sendDisabled = actions.busy || !trimmedName || channels.length === 0;

  return (
    <section className="bg-chalk border border-border rounded-lg p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
            {ROLE_LABEL[role]}
          </div>
          <h2 className="font-display text-[20px] font-semibold text-walnut">
            {trimmedName || "Not yet assigned"}
          </h2>
        </div>
        {row.participant && status !== "planned" && <SpeakerStatusChip status={status} />}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3">
        <PrayerPlanField
          label="Name"
          value={row.name}
          onChange={row.setName}
          placeholder="Sister Reyes"
        />
        <PrayerPlanField
          label="Email"
          value={row.email}
          onChange={row.setEmail}
          type="email"
          placeholder="reyes@example.com"
        />
        <PrayerPlanField
          label="Phone"
          value={row.phone}
          onChange={row.setPhone}
          type="tel"
          placeholder="+1 555 123 4567"
        />
      </div>

      {actions.error && <p className="font-sans text-[12.5px] text-bordeaux">{actions.error}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void actions.send([...channels])}
          disabled={sendDisabled}
          className="rounded-md border border-bordeaux bg-bordeaux px-3.5 py-2 font-sans text-[13.5px] font-semibold text-chalk hover:bg-bordeaux-deep disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {actions.busy ? "Working…" : alreadyInvited ? "Resend invitation →" : "Send invitation →"}
        </button>
        <button
          type="button"
          onClick={() => void actions.markInvited()}
          disabled={actions.busy || !trimmedName || alreadyInvited}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2 disabled:opacity-50"
        >
          Mark invited
        </button>
        <Link
          to={`/week/${date}/prayer/${role}/prepare`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-bordeaux hover:text-bordeaux-deep underline-offset-2 hover:underline ml-auto"
        >
          Customise letter →
        </Link>
      </div>
    </section>
  );
}
