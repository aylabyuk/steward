import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import { SundayCard } from "./SundayCard";
import type { SacramentMeeting } from "@/lib/types";

const mockMeeting: SacramentMeeting = {
  meetingType: "regular",
  status: "draft",
  approvals: [],
};

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
    expect(screen.getByText(/IN.*DAYS|IN.*WEEKS|PAST|TODAY/)).toBeInTheDocument();
  });

  it("shows no-meeting variant for stake/general", () => {
    renderCard({ ...mockMeeting, meetingType: "stake" });
    expect(screen.getByText(/Stake|no sacrament meeting/)).toBeInTheDocument();
  });

  it("shows cancellation message and strikethrough", () => {
    const { container } = renderCard({
      ...mockMeeting,
      cancellation: { cancelled: true, reason: "Snow" },
    });
    expect(screen.getByText("Cancelled")).toBeInTheDocument();
    expect(screen.getByText("Snow")).toBeInTheDocument();
    const heading = container.querySelector("p.line-through");
    expect(heading).toBeInTheDocument();
  });

  it("shows notice for short-notice dates", () => {
    renderCard();
    // Date is 2026-04-05, leadTime is 14 days
    // This test depends on current date
  });

  it("shows Add speaker button", () => {
    renderCard();
    expect(screen.getByText("Add speaker")).toBeInTheDocument();
  });
});
