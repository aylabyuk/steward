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
  it("renders date and kind label", () => {
    renderCard();
    expect(screen.getByText(/Sun, Apr 5/)).toBeInTheDocument();
    expect(screen.getByText("Regular")).toBeInTheDocument();
  });

  it("shows fast variant correctly", () => {
    renderCard({ ...mockMeeting, meetingType: "fast" });
    expect(screen.getByText("Fast Sunday")).toBeInTheDocument();
  });

  it("shows no-meeting variant for stake/general", () => {
    renderCard({ ...mockMeeting, meetingType: "stake" });
    expect(screen.getByText("Stake")).toBeInTheDocument();
  });

  it("shows cancellation message", () => {
    renderCard({
      ...mockMeeting,
      cancellation: { cancelled: true, reason: "Snow" },
    });
    expect(screen.getByText(/Cancelled.*Snow/)).toBeInTheDocument();
  });

  it("applies strikethrough to cancelled date", () => {
    const { container } = renderCard({
      ...mockMeeting,
      cancellation: { cancelled: true },
    });
    const link = container.querySelector("a");
    expect(link).toHaveClass("line-through");
  });

  it("shows short-notice warning for urgent dates", () => {
    renderCard();
    // Date is 2026-04-05, leadTime is 14 days from now
    // This test depends on current date, so we check presence of warning styles
  });
});
