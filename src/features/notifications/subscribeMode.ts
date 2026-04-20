export type SubscribeMode = "hidden" | "ios-nudge" | "subscribe" | "subscribed";

export interface SubscribeModeInput {
  permission: NotificationPermission | "unsupported";
  hasTokens: boolean;
  promptDismissed: boolean;
  iosNudgeDismissed: boolean;
  iosNeedsInstall: boolean;
}

export function detectMode(input: SubscribeModeInput): SubscribeMode {
  if (input.permission === "unsupported") return "hidden";
  if (input.iosNeedsInstall && !input.iosNudgeDismissed) return "ios-nudge";
  if (input.hasTokens) return "subscribed";
  if (input.permission === "granted") return "subscribe";
  if (input.permission === "denied") return "hidden";
  if (input.promptDismissed) return "hidden";
  return "subscribe";
}
