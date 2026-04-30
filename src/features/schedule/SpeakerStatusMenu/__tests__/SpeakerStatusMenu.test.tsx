import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeakerStatusMenu } from "../SpeakerStatusMenu";

afterEach(() => {
  cleanup();
});

async function openMenu() {
  await userEvent.click(screen.getByRole("button", { name: /Tap to change/i }));
}

describe("SpeakerStatusMenu", () => {
  it("does not call onChange when picking the currently active status", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="planned" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Planned/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("Invited → Planned is frictionless (no commitment to erase)", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="invited" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Planned/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("planned");
  });

  it("Confirmed → Planned surfaces the rollback dialog and requires confirm", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="confirmed" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Planned/i }));

    expect(screen.getByText(/Clear confirmed status\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Rolling back to Planned clears that commitment/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /Clear confirmation/i }));
    expect(onChange).toHaveBeenCalledWith("planned");
  });

  it("Declined → Invited surfaces the Undo-decline rollback dialog", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="declined" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Invited/i }));

    expect(screen.getByText(/Undo decline\?/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Undo decline/i }));
    expect(onChange).toHaveBeenCalledWith("invited");
  });

  it("opens a confirmation dialog when switching to Invited", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="planned" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Invited/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Mark as Invited\?/i)).toBeInTheDocument();
    expect(screen.getByText(/You won't be able to send an in-app invitation/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancel keeps the prior status", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="planned" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Confirmed/i }));
    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("confirm applies the change and dismisses the dialog", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusMenu status="planned" onChange={onChange} />);

    await openMenu();
    await userEvent.click(screen.getByRole("menuitem", { name: /Mark as Declined/i }));
    await userEvent.click(screen.getByRole("button", { name: /Mark as Declined/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("declined");
  });

  it("active status carries a checkmark glyph", async () => {
    render(<SpeakerStatusMenu status="invited" onChange={vi.fn()} />);
    await openMenu();
    const invitedItem = screen.getByRole("menuitem", { name: /Invited/i });
    expect(invitedItem.textContent).toContain("✓");
  });
});
