import { type NotificationPrefs, notificationPrefsSchema } from "@/lib/types";

export function formatQuietHours(prefs: NotificationPrefs | undefined): string {
  if (!prefs?.quietHours) return "(none)";
  const { startHour, endHour } = prefs.quietHours;
  return `${pad(startHour)}:00 – ${pad(endHour)}:00`;
}

function pad(h: number): string {
  return h.toString().padStart(2, "0");
}

export function withDefaults(prefs: NotificationPrefs | undefined): NotificationPrefs {
  return notificationPrefsSchema.parse(prefs ?? {});
}
