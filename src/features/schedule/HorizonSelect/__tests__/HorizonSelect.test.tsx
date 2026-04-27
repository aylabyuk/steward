import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizonSelect } from "../HorizonSelect";

describe("HorizonSelect", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders with initial value", () => {
    render(<HorizonSelect value={8} onChange={() => {}} />);
    expect(screen.getByText("Next 8 weeks")).toBeInTheDocument();
  });

  it("persists selection to localStorage", async () => {
    const onChange = vi.fn();
    render(<HorizonSelect value={8} onChange={onChange} />);

    const button = screen.getByRole("button", { name: /Next 8 weeks/ });
    await userEvent.click(button);

    const option = screen.getByRole("button", { name: "Next 12 weeks" });
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith(12);
    expect(localStorage.getItem("schedule-horizon-weeks")).toBe("12");
  });

  it("shows dropdown menu on click", async () => {
    render(<HorizonSelect value={8} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /Next 8 weeks/ });
    await userEvent.click(button);

    expect(screen.getByText("Next 4 weeks")).toBeInTheDocument();
    expect(screen.getByText("Next 16 weeks")).toBeInTheDocument();
  });

  it("closes dropdown on selection", async () => {
    render(<HorizonSelect value={8} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /Next 8 weeks/ });
    await userEvent.click(button);

    const option = screen.getByRole("button", { name: "Next 12 weeks" });
    await userEvent.click(option);

    expect(screen.queryByText("Next 4 weeks")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", async () => {
    render(<HorizonSelect value={8} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /Next 8 weeks/ });
    await userEvent.click(button);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("Next 4 weeks")).not.toBeInTheDocument();
  });
});
