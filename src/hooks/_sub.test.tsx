import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { z } from "zod";

// Mock firebase/firestore so the hook never actually subscribes to a
// real backend. Capture the onSnapshot callback so individual tests
// can drive it directly with synthetic Firestore snapshot fires.
type OnNext = (snap: FakeSnap) => void;
type OnError = (err: Error) => void;
let lastOnNext: OnNext | null = null;
let lastOnError: OnError | null = null;
let unsubSpy: () => void = () => {};

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(() => ({})),
  onSnapshot: vi.fn((_ref: unknown, onNext: OnNext, onError?: OnError) => {
    lastOnNext = onNext;
    lastOnError = onError ?? null;
    unsubSpy = vi.fn();
    return unsubSpy;
  }),
  collection: vi.fn(() => ({})),
}));
vi.mock("@/lib/firebase", () => ({ db: {} }));

// Auth store factory — let each test set the auth status.
const setAuthStatus = vi.fn();
vi.mock("@/stores/authStore", () => ({
  useAuthStore: (selector: (s: { status: string }) => unknown) =>
    selector({ status: setAuthStatus.getMockImplementation()?.() ?? "signed_in" }),
}));

import { useDocSnapshot } from "./_sub";

const schema = z.object({ x: z.string() });

interface FakeSnap {
  metadata: { fromCache: boolean };
  exists: () => boolean;
  data: () => Record<string, unknown> | undefined;
}
function fakeSnap(opts: {
  fromCache: boolean;
  exists: boolean;
  data?: Record<string, unknown>;
}): FakeSnap {
  return {
    metadata: { fromCache: opts.fromCache },
    exists: () => opts.exists,
    data: () => opts.data,
  };
}

beforeEach(() => {
  setAuthStatus.mockReset();
  setAuthStatus.mockImplementation(() => "signed_in");
  lastOnNext = null;
  lastOnError = null;
});

describe("useDocSnapshot loading semantics", () => {
  it("stays loading=true when a path segment is undefined (e.g. wardId not yet resolved)", () => {
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", undefined, "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
  });

  it("stays loading=true when a path segment is an empty string", () => {
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "", "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
  });

  it("stays loading=true when the user is signed out (segments still computable but auth blocks)", () => {
    setAuthStatus.mockImplementation(() => "signed_out");
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "stv1", "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
  });

  it("stays loading=true when auth is still loading and segments are filled in", () => {
    setAuthStatus.mockImplementation(() => "loading");
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "stv1", "templates", "speakerLetter"], schema),
    );
    expect(result.current.loading).toBe(true);
  });
});

describe("useDocSnapshot cache-miss handling", () => {
  it("defers a fromCache `!exists` fire so the speaker-letter editor doesn't seed defaults against a transient false negative", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useDocSnapshot(["wards", "stv1", "meetings", "2026-04-26", "prayers", "opening"], schema),
      );
      expect(result.current.loading).toBe(true);
      await act(async () => {
        lastOnNext?.(fakeSnap({ fromCache: true, exists: false }));
      });
      // Cache miss is held — caller still sees loading.
      expect(result.current.loading).toBe(true);
      // Server-confirmed snapshot arrives within the deferral window.
      await act(async () => {
        lastOnNext?.(fakeSnap({ fromCache: false, exists: true, data: { x: "real" } }));
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({ x: "real" });
      // Advance past the deferral window — no late state change.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(result.current.data).toEqual({ x: "real" });
    } finally {
      vi.useRealTimers();
    }
  });

  it("resolves loading=false after the deferral window when no server fire arrives — empty prayer slot recovery", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useDocSnapshot(["wards", "stv1", "meetings", "2026-04-26", "prayers", "opening"], schema),
      );
      await act(async () => {
        lastOnNext?.(fakeSnap({ fromCache: true, exists: false }));
      });
      expect(result.current.loading).toBe(true);
      // Simulate the bug: server-confirmed snapshot never arrives.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1500);
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("resolves immediately when the server confirms the doc doesn't exist", async () => {
    const { result } = renderHook(() =>
      useDocSnapshot(["wards", "stv1", "meetings", "2026-04-26", "prayers", "opening"], schema),
    );
    await act(async () => {
      lastOnNext?.(fakeSnap({ fromCache: false, exists: false }));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
  });

  it("surfaces onSnapshot errors immediately and clears the deferral timer", async () => {
    vi.useFakeTimers();
    try {
      const { result } = renderHook(() =>
        useDocSnapshot(["wards", "stv1", "meetings", "2026-04-26", "prayers", "opening"], schema),
      );
      await act(async () => {
        lastOnNext?.(fakeSnap({ fromCache: true, exists: false }));
      });
      const err = new Error("permission-denied");
      await act(async () => {
        lastOnError?.(err);
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(err);
      // Timer fires later — must not stomp the error state.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000);
      });
      expect(result.current.error).toBe(err);
    } finally {
      vi.useRealTimers();
    }
  });
});
