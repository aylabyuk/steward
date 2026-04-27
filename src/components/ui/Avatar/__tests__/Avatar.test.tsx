import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Avatar } from "../Avatar";

afterEach(() => cleanup());

describe("Avatar", () => {
  it("renders the Google photo when photoURL is present", () => {
    const { container } = render(
      <Avatar user={{ uid: "u1", displayName: "Bishop Jones", photoURL: "https://g/a.jpg" }} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    expect(img?.getAttribute("src")).toBe("https://g/a.jpg");
    expect(img?.getAttribute("alt")).toBe("Bishop Jones");
    expect(img?.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(img?.getAttribute("loading")).toBe("lazy");
  });

  it("falls back to initials when the image errors", () => {
    const { container, rerender } = render(
      <Avatar user={{ uid: "u1", displayName: "Bishop Jones", photoURL: "https://g/a.jpg" }} />,
    );
    const img = container.querySelector("img");
    expect(img).not.toBeNull();
    fireEvent.error(img!);
    rerender(
      <Avatar user={{ uid: "u1", displayName: "Bishop Jones", photoURL: "https://g/a.jpg" }} />,
    );
    expect(screen.getByText("BJ")).toBeTruthy();
  });

  it("renders deterministic initials when photoURL is absent", () => {
    render(<Avatar user={{ uid: "u1", displayName: "Sister Park" }} />);
    expect(screen.getByText("SP")).toBeTruthy();
  });

  it("renders the silhouette when both photoURL and displayName are missing", () => {
    const { container } = render(<Avatar user={{ uid: "u1" }} />);
    const svg = container.querySelector("svg");
    expect(svg).not.toBeNull();
    const root = container.querySelector('[aria-label="Unknown user"]');
    expect(root).not.toBeNull();
  });

  it("exposes the display name to assistive tech", () => {
    render(<Avatar user={{ displayName: "Sister Park" }} />);
    const bubble = screen.getByLabelText("Sister Park");
    expect(bubble).toBeTruthy();
  });
});
