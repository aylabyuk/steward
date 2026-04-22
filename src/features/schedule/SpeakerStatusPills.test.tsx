import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SpeakerStatusPills } from "./SpeakerStatusPills";

afterEach(() => {
  cleanup();
});

describe("SpeakerStatusPills", () => {
  it("does not call onChange when clicking the currently active pill", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusPills status="planned" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /Planned/i }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies the change directly when switching back to Planned", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusPills status="invited" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /Planned/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("planned");
  });

  it("opens a confirmation dialog when switching to Invited", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusPills status="planned" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /Invited/i }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Mark as Invited\?/i)).toBeInTheDocument();
    expect(screen.getByText(/You won't be able to send an in-app invitation/i)).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("cancel keeps the prior status", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusPills status="planned" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /Confirmed/i }));
    await userEvent.click(screen.getByRole("button", { name: /Cancel/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
  });

  it("confirm applies the change and dismisses the dialog", async () => {
    const onChange = vi.fn();
    render(<SpeakerStatusPills status="planned" onChange={onChange} />);

    await userEvent.click(screen.getByRole("radio", { name: /Declined/i }));
    await userEvent.click(screen.getByRole("button", { name: /Mark as Declined/i }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).toHaveBeenCalledWith("declined");
  });
});
