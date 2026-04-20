import type { WardSettings } from "@/lib/types";
import { isValidTimezone } from "./timezone";

export const HORIZON_MIN = 1;
export const HORIZON_MAX = 52;
export const LEAD_MIN = 0;
export const LEAD_MAX = 60;

export interface WardSettingsErrors {
  timezone?: string;
  speakerLeadTimeDays?: string;
  scheduleHorizonWeeks?: string;
}

export function validateWardSettings(draft: WardSettings): WardSettingsErrors {
  const errors: WardSettingsErrors = {};
  if (!isValidTimezone(draft.timezone)) errors.timezone = "Not a valid IANA timezone";
  if (draft.speakerLeadTimeDays < LEAD_MIN || draft.speakerLeadTimeDays > LEAD_MAX) {
    errors.speakerLeadTimeDays = `Must be ${LEAD_MIN}–${LEAD_MAX} days`;
  }
  if (draft.scheduleHorizonWeeks < HORIZON_MIN || draft.scheduleHorizonWeeks > HORIZON_MAX) {
    errors.scheduleHorizonWeeks = `Must be ${HORIZON_MIN}–${HORIZON_MAX} weeks`;
  }
  return errors;
}
