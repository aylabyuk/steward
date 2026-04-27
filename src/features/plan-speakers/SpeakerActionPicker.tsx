import { useState } from "react";
import type { Speaker } from "@/lib/types";
import type { WithId } from "@/hooks/_sub";
import { useLatestInvitation } from "@/features/invitations/useLatestInvitation";
import { isPlausiblePhone } from "@/features/templates/smsInvitation";
import { isValidEmail } from "@/lib/email";
import { MissingContactPrompt } from "./MissingContactPrompt";
import { SpeakerStatusChip } from "./SpeakerStatusChip";
import { WizardFooter } from "./WizardFooter";

export type ActionMode = "send" | "resend" | "print";

interface Props {
  speaker: WithId<Speaker>;
  wardId: string;
  date: string;
  onPick: (mode: ActionMode) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function SpeakerActionPicker({ speaker, wardId, date, onPick, onSkip, onBack }: Props) {
  const { invitation } = useLatestInvitation(wardId, date, speaker.id);
  const [collectingContact, setCollectingContact] = useState(false);

  const email = (speaker.data.email ?? "").trim();
  const phone = (speaker.data.phone ?? "").trim();
  const hasEmail = isValidEmail(email);
  const hasPhone = isPlausiblePhone(phone);
  const hasContact = hasEmail || hasPhone;
  const alreadyInvited = invitation !== null || speaker.data.status !== "planned";
  const primary: ActionMode = alreadyInvited ? "resend" : "send";

  if (collectingContact) {
    return (
      <MissingContactPrompt
        speaker={speaker}
        wardId={wardId}
        date={date}
        onCancel={() => setCollectingContact(false)}
        onSaved={() => {
          setCollectingContact(false);
          onPick(primary);
        }}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-3xl w-full mx-auto px-5 sm:px-8 py-3">
          <div className="bg-chalk border border-border rounded-lg p-5 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-[20px] font-semibold text-walnut">
                  {speaker.data.name}
                </h2>
                {speaker.data.topic && (
                  <p className="font-serif text-[13.5px] text-walnut-2">{speaker.data.topic}</p>
                )}
              </div>
              <SpeakerStatusChip status={speaker.data.status} />
            </div>

            <p className="font-serif text-[13.5px] text-walnut-2 leading-relaxed">
              {alreadyInvited
                ? "An invitation has already been sent. Resend it (with any letter edits), share the letter directly, or skip."
                : "How would you like to invite this speaker?"}
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
                <button
                  type="button"
                  onClick={() => setCollectingContact(true)}
                  className="rounded-md border border-bordeaux bg-bordeaux px-4 py-2.5 font-sans text-[14px] font-semibold text-chalk hover:bg-bordeaux-deep text-left"
                >
                  Add email or phone first →
                </button>
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
