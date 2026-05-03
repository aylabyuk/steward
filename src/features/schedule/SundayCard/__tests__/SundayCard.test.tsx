import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import { SundayCard } from "../SundayCard";
import type { SacramentMeeting } from "@/lib/types";

const mockMeeting = {
  meetingType: "regular",
  wardBusiness: "",
  stakeBusiness: "",
  announcements: "",
} as unknown as SacramentMeeting;

function renderCard(meeting: SacramentMeeting | null = mockMeeting) {
  return render(
    <BrowserRouter>
      <SundayCard
        date="2026-04-05"
        meeting={meeting}
        fallbackType="regular"
        leadTimeDays={14}
        nonMeetingSundays={[]}
      />
    </BrowserRouter>,
  );
}

describe("SundayCard", () => {
  it("renders date", () => {
    renderCard();
    expect(screen.getByText("Apr 5")).toBeInTheDocument();
  });

  it("shows countdown text", () => {
    renderCard();
    expect(screen.getByText(/In \d|Past|Today/)).toBeInTheDocument();
  });

  it("shows Stake Conference variant with stake-wide stamp", () => {
    renderCard({ ...mockMeeting, meetingType: "stake" });
    expect(screen.getByText(/Stake Conference/)).toBeInTheDocument();
    expect(screen.getAllByText(/stake-wide session/i).length).toBeGreaterThan(0);
  });

  it("shows Fast Sunday variant with testimony stamp", () => {
    renderCard({ ...mockMeeting, meetingType: "fast" });
    expect(screen.getByText(/Fast Sunday/)).toBeInTheDocument();
    expect(screen.getByText(/member testimonies/i)).toBeInTheDocument();
  });

  it("shows cancellation message and strikethrough", () => {
    const { container } = renderCard({
      ...mockMeeting,
      cancellation: {
        cancelled: true,
        reason: "Snow",
        cancelledAt: null,
        cancelledBy: "test",
      },
    });
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Snow")).toBeInTheDocument();
    const heading = container.querySelector("p.line-through");
    expect(heading).toBeInTheDocument();
  });

  it("shows Assign Speaker pills on empty rows", () => {
    renderCard();
    // Fresh card with no speakers shows the floor of 2 placeholder
    // rows — not the old fixed 4 — so the meeting reads as an
    // invitation to assign without padding the height with empty
    // noise.
    expect(screen.getAllByText("Assign Speaker")).toHaveLength(2);
    expect(screen.queryByText("Add another speaker")).toBeNull();
  });
});
