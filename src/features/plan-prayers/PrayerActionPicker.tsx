import type { PrayerParticipant, PrayerRole } from "@/lib/types";
import { useLatestInvitation } from "@/features/invitations/hooks/useLatestInvitation";
import { isPlausiblePhone } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { SpeakerStatusChip } from "@/features/plan-speakers/SpeakerStatusChip";
import { WizardFooter } from "@/features/plan-speakers/WizardFooter";

export type PrayerActionMode = "send" | "resend" | "print";

const ROLE_LABEL: Record<PrayerRole, string> = {
  opening: "Opening prayer",
  benediction: "Benediction",
};

interface Props {
  role: PrayerRole;
  participant: PrayerParticipant;
  wardId: string;
  date: string;
  onPick: (mode: PrayerActionMode) => void;
  onSkip: () => void;
  onBack: () => void;
}

/** Mirror of `SpeakerActionPicker` for prayer-givers. The roster
 *  step collects contact info up-front, so this picker just routes
 *  Send / Resend / Print / Skip without a separate
 *  MissingContactPrompt branch — when contact is empty, Send is
 *  disabled with a helper line. */
export function PrayerActionPicker({
  role,
  participant,
  wardId,
  date,
  onPick,
  onSkip,
  onBack,
}: Props) {
  const { invitation } = useLatestInvitation(wardId, date, role);
  const email = (participant.email ?? "").trim();
  const phone = (participant.phone ?? "").trim();
  const hasEmail = isValidEmail(email);
  const hasPhone = isPlausiblePhone(phone);
  const hasContact = hasEmail || hasPhone;
  const status = participant.status ?? "planned";
  const alreadyInvited = invitation !== null || status !== "planned";
  const primary: PrayerActionMode = alreadyInvited ? "resend" : "send";

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-3">
          <div className="bg-chalk border border-border rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-brass-deep font-medium">
                  {ROLE_LABEL[role]}
                </div>
                <h2 className="font-display text-[20px] font-semibold text-walnut">
                  {participant.name}
                </h2>
              </div>
              <SpeakerStatusChip status={status} />
            </div>

            <p className="font-serif text-[13.5px] text-walnut-2 leading-relaxed">
              {alreadyInvited
                ? "An invitation has already been sent. Resend it (with any letter edits), share the letter directly, or skip."
                : "How would you like to invite this prayer-giver?"}
            </p>

            <div className="flex flex-col gap-2">
              {hasContact ? (
                <button
                  type="button"
                  onClick={() => onPick(primary)}
                  className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep text-left"
                >
                  {alreadyInvited ? "Resend invitation →" : "Send invitation →"}
                  <span className="block font-mono text-[10px] uppercase tracking-[0.14em] opacity-80 mt-0.5">
                    {channelLabel(hasEmail, hasPhone)}
                  </span>
                </button>
              ) : (
                <div className="rounded-md border border-border-strong bg-parchment-2 px-4 py-2.5 font-sans text-[13.5px] text-walnut-3">
                  Add an email or phone in the roster step to send an invitation.
                </div>
              )}
              <button
                type="button"
                onClick={() => onPick("print")}
                className="rounded-md border border-border-strong bg-chalk px-4 py-2.5 font-sans text-[14px] font-semibold text-walnut hover:bg-parchment-2 text-left"
              >
                Share or print letter →
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="rounded-md border border-border bg-chalk px-4 py-2.5 font-sans text-[13.5px] text-walnut-2 hover:bg-parchment-2 text-left"
              >
                Skip — keep planned
              </button>
            </div>
          </div>
        </div>
      </div>

      <WizardFooter align="between">
        <button
          type="button"
          onClick={onBack}
          className="rounded-md border border-border-strong bg-chalk px-3.5 py-2 font-sans text-[13px] font-semibold text-walnut hover:bg-parchment-2"
        >
          ← Back
        </button>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-walnut-3">
          Pick an option above
        </span>
      </WizardFooter>
    </div>
  );
}

function channelLabel(email: boolean, phone: boolean): string {
  if (email && phone) return "Email + SMS";
  if (email) return "Email";
  return "SMS";
}
