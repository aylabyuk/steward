// Trimmed shapes of the Firestore docs the functions read. We avoid pulling
// the app's Zod schemas to keep the functions package self-contained -- if
// the schema drifts we'd rather see TypeScript errors at build than a runtime
// import cycle.

export interface FcmToken {
  token: string;
  platform?: "web" | "ios" | "android";
  updatedAt?: unknown;
}

export interface NotificationPrefs {
  enabled?: boolean;
  quietHours?: { startHour: number; endHour: number };
}

export interface MemberDoc {
  email: string;
  displayName: string;
  role: "bishopric" | "clerk";
  active: boolean;
  ccOnEmails?: boolean;
  fcmTokens?: FcmToken[];
  notificationPrefs?: NotificationPrefs;
}

export interface CommentDoc {
  authorUid: string;
  authorDisplayName: string;
  body: string;
  mentionedUids?: string[];
}

export interface WardSettingsDoc {
  timezone: string;
}

export interface WardDoc {
  name: string;
  settings: WardSettingsDoc;
}
