interface Props {
  speakerName: string;
}

/** Content-only prompt (no buttons). Lives inside the wizard's
 *  scroll body; the host renders the action buttons in the shared
 *  WizardFooter so they sit pinned at the bottom of the page. */
export function HandDeliveryConfirmPrompt({ speakerName }: Props) {
  return (
    <div className="bg-chalk border border-border rounded-lg p-5 flex flex-col gap-4">
      <h2 className="font-display text-[18px] font-semibold text-walnut">
        Did you deliver this letter to {speakerName}?
      </h2>
      <p className="font-serif text-[13.5px] text-walnut-2 leading-relaxed">
        If you sent the letter through Messages / Mail / AirDrop / WhatsApp, or handed off a
        printout, we'll mark them as invited so the schedule reflects it. Otherwise, you can leave
        them planned and try again later.
      </p>
    </div>
  );
}
