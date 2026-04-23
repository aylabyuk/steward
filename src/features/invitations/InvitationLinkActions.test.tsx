import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./invitationsCallable", () => ({
  callRotateInvitationLink: vi.fn(),
}));

import { callRotateInvitationLink } from "./invitationsCallable";
import { InvitationLinkActions } from "./InvitationLinkActions";
import type { SpeakerInvitation } from "@/lib/types";

const mockFn = vi.mocked(callRotateInvitationLink);

function mkInvitation(overrides: Partial<SpeakerInvitation> = {}): SpeakerInvitation {
  return {
    speakerRef: { meetingDate: "2026-05-03", speakerId: "sp1" },
    assignedDate: "Sunday, May 3, 2026",
    sentOn: "April 22, 2026",
    wardName: "Elk River Ward",
    speakerName: "Sister Jones",
    inviterName: "Bishop Smith",
    bodyMarkdown: "body",
    footerMarkdown: "footer",
    speakerEmail: "jones@example.com",
    speakerPhone: "+14165551234",
    deliveryRecord: [],
    createdAt: new Date() as unknown as SpeakerInvitation["createdAt"],
    ...overrides,
  };
}

beforeEach(() => {
  mockFn.mockReset();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  cleanup();
});

describe("InvitationLinkActions", () => {
  it("calls rotate with empty channels for Copy link, writes URL to clipboard", async () => {
    mockFn.mockResolvedValue({
      mode: "rotate",
      inviteUrl: "https://app.example/invite/speaker/w1/i1/tok",
      deliveryRecord: [],
    });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    fireEvent.click(screen.getByText("Copy link"));
    await waitFor(() => expect(screen.getByText("Copied ✓")).toBeTruthy());
    expect(mockFn).toHaveBeenCalledWith({
      mode: "rotate",
      wardId: "w1",
      invitationId: "i1",
      channels: [],
    });
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "https://app.example/invite/speaker/w1/i1/tok",
    );
  });

  it("resend button includes both channels when invitation has email + phone", () => {
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    expect(screen.getByText("Resend EMAIL + SMS")).toBeTruthy();
  });

  it("resend button is disabled when invitation has no email or phone", () => {
    const inv = mkInvitation({ speakerEmail: undefined, speakerPhone: undefined });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={inv} />);
    const btn = screen.getByTitle("No email or phone on file") as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it("surfaces a partial-failure message when every delivery failed", async () => {
    mockFn.mockResolvedValue({
      mode: "rotate",
      inviteUrl: "https://app.example/invite/speaker/w1/i1/tok",
      deliveryRecord: [{ channel: "sms", status: "failed", error: "twilio: 21610", at: "now" }],
    });
    const inv = mkInvitation({ speakerEmail: undefined });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={inv} />);
    fireEvent.click(screen.getByText("Resend SMS"));
    await waitFor(() => expect(screen.getByText("All delivery attempts failed.")).toBeTruthy());
  });

  it("reports the channels that actually sent on success", async () => {
    mockFn.mockResolvedValue({
      mode: "rotate",
      inviteUrl: "https://app.example/invite/speaker/w1/i1/tok",
      deliveryRecord: [
        { channel: "sms", status: "sent", providerId: "SM1", at: "now" },
        { channel: "email", status: "failed", error: "bounced", at: "now" },
      ],
    });
    render(<InvitationLinkActions wardId="w1" invitationId="i1" invitation={mkInvitation()} />);
    fireEvent.click(screen.getByText("Resend EMAIL + SMS"));
    await waitFor(() => expect(screen.getByText("Sent via SMS")).toBeTruthy());
  });
});
