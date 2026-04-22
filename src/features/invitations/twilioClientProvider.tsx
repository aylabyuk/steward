import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Client as TwilioClient } from "@twilio/conversations";
import { callIssueTwilioToken } from "./invitationsCallable";

type Status = "idle" | "connecting" | "ready" | "error";

interface ConnectOptions {
  wardId: string;
  /** Required for speaker-side connect (scopes identity to one
   *  invitation). Bishopric connect leaves it omitted. */
  invitationToken?: string;
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
export function TwilioChatProvider({ children }: { children: React.ReactNode }): React.ReactElement {
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
      const tokenRes = await callIssueTwilioToken({
        wardId: opts.wardId,
        ...(opts.invitationToken ? { invitationToken: opts.invitationToken } : {}),
      });
      const client = new TwilioClient(tokenRes.jwt);
      client.on("tokenAboutToExpire", async () => {
        if (!opsRef.current) return;
        const refreshed = await callIssueTwilioToken({
          wardId: opsRef.current.wardId,
          ...(opsRef.current.invitationToken
            ? { invitationToken: opsRef.current.invitationToken }
            : {}),
        });
        await client.updateToken(refreshed.jwt);
      });
      client.on("tokenExpired", () => setStatus("error"));
      client.on("stateChanged", (state) => {
        if (state === "initialized") setStatus("ready");
        if (state === "failed") setStatus("error");
      });
      clientRef.current = client;
      opsRef.current = opts;
      setIdentity(tokenRes.identity);
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
