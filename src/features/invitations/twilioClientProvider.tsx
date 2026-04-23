import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Client as TwilioClient } from "@twilio/conversations";
import { callIssueSpeakerSession } from "./invitationsCallable";

type Status = "idle" | "connecting" | "ready" | "error";

interface ConnectOptions {
  wardId: string;
  /** Required for speaker-side connect (scopes identity to one
   *  invitation). Bishopric connect leaves it omitted. */
  invitationId?: string;
  /** Route through the isolated invite Firebase app. Speakers only;
   *  bishopric connects go through the default app. */
  useInviteApp?: boolean;
}

interface Ctx {
  status: Status;
  identity: string | null;
  error: Error | null;
  client: TwilioClient | null;
  connect: (opts: ConnectOptions) => Promise<void>;
  disconnect: () => Promise<void>;
}

const TwilioChatCtx = createContext<Ctx | null>(null);

/** Owns the Twilio Conversations client for the current tab. Lazily
 *  connects when a consumer calls `connect()`; handles token refresh
 *  via the `tokenAboutToExpire` client event. */
export function TwilioChatProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [status, setStatus] = useState<Status>("idle");
  const [identity, setIdentity] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const clientRef = useRef<TwilioClient | null>(null);
  const opsRef = useRef<ConnectOptions | null>(null);

  const connect = useCallback(async (opts: ConnectOptions): Promise<void> => {
    if (clientRef.current) return;
    setStatus("connecting");
    setError(null);
    try {
      const initial = await issueFreshToken(opts);
      const client = new TwilioClient(initial.twilioToken);
      client.on("tokenAboutToExpire", async () => {
        if (!opsRef.current) return;
        const refreshed = await issueFreshToken(opsRef.current);
        await client.updateToken(refreshed.twilioToken);
      });
      client.on("tokenExpired", () => setStatus("error"));
      client.on("stateChanged", (state) => {
        if (state === "initialized") setStatus("ready");
        if (state === "failed") setStatus("error");
      });
      clientRef.current = client;
      opsRef.current = opts;
      setIdentity(initial.identity);
    } catch (err) {
      setError(err as Error);
      setStatus("error");
      throw err;
    }
  }, []);

  const disconnect = useCallback(async (): Promise<void> => {
    const c = clientRef.current;
    clientRef.current = null;
    opsRef.current = null;
    setIdentity(null);
    setStatus("idle");
    if (c) await c.shutdown();
  }, []);

  useEffect(() => {
    return () => {
      if (clientRef.current) void clientRef.current.shutdown();
    };
  }, []);

  const value = useMemo(
    () => ({ status, identity, error, client: clientRef.current, connect, disconnect }),
    [status, identity, error, connect, disconnect],
  );

  return <TwilioChatCtx.Provider value={value}>{children}</TwilioChatCtx.Provider>;
}

export function useTwilioChat(): Ctx {
  const ctx = useContext(TwilioChatCtx);
  if (!ctx) throw new Error("useTwilioChat must be used within a TwilioChatProvider");
  return ctx;
}

/** Minted once on connect and again on `tokenAboutToExpire`. Speaker
 *  refresh uses the invite app (passes the custom-token session); the
 *  server sees the auth claim + existing session and returns a fresh
 *  Twilio token without triggering the capability-token branch. */
async function issueFreshToken(
  opts: ConnectOptions,
): Promise<{ twilioToken: string; identity: string }> {
  const res = await callIssueSpeakerSession(
    {
      wardId: opts.wardId,
      ...(opts.invitationId ? { invitationId: opts.invitationId } : {}),
    },
    opts.useInviteApp ? { useInviteApp: true } : {},
  );
  if (res.status !== "ready") {
    throw new Error(`Twilio token unavailable: ${res.status}`);
  }
  return { twilioToken: res.twilioToken, identity: res.identity };
}
