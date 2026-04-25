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
  speakerEmail: "",
  speakerPhone: "",
  onRevert: noop,
  onMarkInvited: noop,
  onPrint: noop,
  onSend: noop,
  onSendSms: noop,
};

describe("PrepareInvitationActionBar — SMS", () => {
  it("Send SMS is always enabled now — clicking opens the input dialog", () => {
    render(<PrepareInvitationActionBar {...baseProps} canSms={false} speakerPhone="" />);
    const smsBtn = screen.getByRole("button", { name: "Send SMS" });
    expect(smsBtn).not.toBeDisabled();
  });

  it("clicking Send SMS opens the channel dialog prefilled with the phone on file", async () => {
    const onSendSms = vi.fn();
    render(
      <PrepareInvitationActionBar
        {...baseProps}
        canSms
        speakerPhone="+14165551234"
        onSendSms={onSendSms}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Send SMS" }));
    expect(screen.getByText(/Text invitation to Sister Reeves/i)).toBeInTheDocument();
    const input = screen.getByDisplayValue("+14165551234");
    expect(input).toBeInTheDocument();
    expect(onSendSms).not.toHaveBeenCalled();

    // Dialog's primary "Send SMS" is the second button with that label
    // (the toolbar icon is the first).
    const sendSmsButtons = screen.getAllByRole("button", { name: /Send SMS/i });
    await userEvent.click(sendSmsButtons.at(-1)!);
    expect(onSendSms).toHaveBeenCalledTimes(1);
    expect(onSendSms).toHaveBeenCalledWith("+14165551234");
  });

  it("cancel closes the dialog without firing onSendSms", async () => {
    const onSendSms = vi.fn();
    render(
      <PrepareInvitationActionBar
        {...baseProps}
        canSms
        speakerPhone="+14165551234"
        onSendSms={onSendSms}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Send SMS" }));
    const cancelBtns = screen.getAllByRole("button", { name: /^Cancel$/i });
    await userEvent.click(cancelBtns[cancelBtns.length - 1]!);
    expect(onSendSms).not.toHaveBeenCalled();
  });

  it("surfaces canSmsReason when Send email is also unavailable", () => {
    render(<PrepareInvitationActionBar {...baseProps} canSmsReason="No phone on file." />);
    expect(screen.getByText("No phone on file.")).toBeInTheDocument();
  });
});
