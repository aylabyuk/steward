import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PrepareInvitationActionBar } from "./PrepareInvitationActionBar";

afterEach(() => cleanup());

function noop() {}

const baseProps = {
  busy: false,
  canSend: false,
  canSendReason: null,
  canSms: false,
  canSmsReason: null,
  hasOverride: false,
  speakerName: "Sister Reeves",
  onRevert: noop,
  onMarkInvited: noop,
  onPrint: noop,
  onSend: noop,
  onSendSms: noop,
};

describe("PrepareInvitationActionBar — SMS", () => {
  it("disables Send SMS when no phone on file", () => {
    render(<PrepareInvitationActionBar {...baseProps} canSms={false} />);
    const smsBtn = screen.getByRole("button", { name: "Send SMS" });
    expect(smsBtn).toBeDisabled();
  });

  it("enables Send SMS when a plausible phone is on file", () => {
    render(<PrepareInvitationActionBar {...baseProps} canSms={true} />);
    const smsBtn = screen.getByRole("button", { name: "Send SMS" });
    expect(smsBtn).not.toBeDisabled();
  });

  it("shows confirm modal before firing onSendSms", async () => {
    const onSendSms = vi.fn();
    render(<PrepareInvitationActionBar {...baseProps} canSms={true} onSendSms={onSendSms} />);

    await userEvent.click(screen.getByRole("button", { name: "Send SMS" }));
    // Confirm modal opens with speaker-specific copy
    expect(screen.getByText(/Text invitation to Sister Reeves/i)).toBeInTheDocument();
    // onSendSms doesn't fire until the primary confirm button is clicked
    expect(onSendSms).not.toHaveBeenCalled();

    // The SMS confirm dialog's primary button is also labeled "Send SMS".
    // There are now two such buttons (the toolbar icon + the dialog primary);
    // pick the last, which is the one rendered inside the dialog.
    const sendSmsButtons = screen.getAllByRole("button", { name: /Send SMS/i });
    await userEvent.click(sendSmsButtons.at(-1)!);
    expect(onSendSms).toHaveBeenCalledTimes(1);
  });

  it("cancel closes the confirm without firing onSendSms", async () => {
    const onSendSms = vi.fn();
    render(<PrepareInvitationActionBar {...baseProps} canSms={true} onSendSms={onSendSms} />);

    await userEvent.click(screen.getByRole("button", { name: "Send SMS" }));
    const cancelBtns = screen.getAllByRole("button", { name: /^Cancel$/i });
    // Modal's Cancel button is inside the dialog (the last one rendered)
    await userEvent.click(cancelBtns[cancelBtns.length - 1]!);
    expect(onSendSms).not.toHaveBeenCalled();
  });

  it("surfaces canSmsReason when Send email is also unavailable", () => {
    render(<PrepareInvitationActionBar {...baseProps} canSmsReason="No phone on file." />);
    expect(screen.getByText("No phone on file.")).toBeInTheDocument();
  });
});
