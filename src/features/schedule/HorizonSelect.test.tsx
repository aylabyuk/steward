import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HorizonSelect } from "./HorizonSelect";

describe("HorizonSelect", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders with initial value", () => {
    render(<HorizonSelect value={9} onChange={() => {}} />);
    expect(screen.getByText("2 months")).toBeInTheDocument();
  });

  it("persists selection to localStorage", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<HorizonSelect value={9} onChange={onChange} />);

    const button = screen.getByRole("button", { name: /2 months/ });
    await userEvent.click(button);

    const option = screen.getByRole("button", { name: "3 months" });
    await userEvent.click(option);

    expect(onChange).toHaveBeenCalledWith(13);
    expect(localStorage.getItem("schedule-horizon-weeks")).toBe("13");
  });

  it("shows dropdown menu on click", async () => {
    render(<HorizonSelect value={9} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /2 months/ });
    await userEvent.click(button);

    expect(screen.getByText("1 month")).toBeInTheDocument();
    expect(screen.getByText("6 months")).toBeInTheDocument();
  });

  it("closes dropdown on selection", async () => {
    render(<HorizonSelect value={9} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /2 months/ });
    await userEvent.click(button);

    const option = screen.getByRole("button", { name: "3 months" });
    await userEvent.click(option);

    expect(screen.queryByText("1 month")).not.toBeInTheDocument();
  });

  it("closes dropdown on Escape key", async () => {
    render(<HorizonSelect value={9} onChange={() => {}} />);
    const button = screen.getByRole("button", { name: /2 months/ });
    await userEvent.click(button);

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByText("1 month")).not.toBeInTheDocument();
  });
});
